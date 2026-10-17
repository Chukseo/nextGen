import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

import { deleteFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user as any;
    const submissionId = params.id;
    const body = await req.json();

    const {
      uploadedFileKey,
      uploadedFileName,
      uploadedFileSize,
      responseToReviewers,
      title,
      abstract,
    } = body;

    if (!uploadedFileKey) {
      return NextResponse.json(
        { error: 'Corrected manuscript document (.docx, .doc, or .pdf) is required.' },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        journal: true,
        files: true,
        reviewAssignments: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.authorId !== user.id) {
      return NextResponse.json({ error: 'Only the submitting author can upload revisions.' }, { status: 403 });
    }

    // Authors can upload corrections before acceptance
    const allowedStatuses = ['SUBMITTED', 'INITIAL_SCREENING', 'UNDER_REVIEW', 'REVISIONS_REQUESTED', 'REVISION_SUBMITTED'];
    if (!allowedStatuses.includes(submission.status)) {
      return NextResponse.json(
        { error: `Cannot upload manuscript corrections when status is "${submission.status}". Corrections are only accepted prior to final acceptance.` },
        { status: 400 }
      );
    }

    // 1. Find previous manuscript files to force delete from physical storage
    const previousManuscriptFiles = submission.files.filter((f) =>
      ['MANUSCRIPT_DOCX', 'MANUSCRIPT_PDF', 'REVISION', 'COPYEDITED'].includes(f.fileType)
    );

    for (const oldFile of previousManuscriptFiles) {
      if (oldFile.storageKey && oldFile.storageKey !== uploadedFileKey) {
        await deleteFile(oldFile.storageKey, 'manuscripts-private');
      }
    }

    // 2. Atomic transaction: Force delete old files and versions from database to maintain only ONE version
    await prisma.$transaction(async (tx) => {
      // Force delete previous manuscript files from DB
      await tx.manuscriptFile.deleteMany({
        where: {
          submissionId: submission.id,
          fileType: { in: ['MANUSCRIPT_DOCX', 'MANUSCRIPT_PDF', 'REVISION', 'COPYEDITED'] },
        },
      });

      // Clear previous versions to maintain single canonical version
      await tx.manuscriptVersion.deleteMany({
        where: { submissionId: submission.id },
      });

      // Insert the new single corrected manuscript file
      const isPdf = (uploadedFileName || '').toLowerCase().endsWith('.pdf');
      await tx.manuscriptFile.create({
        data: {
          submissionId: submission.id,
          versionNumber: 1,
          fileType: isPdf ? 'MANUSCRIPT_PDF' : 'MANUSCRIPT_DOCX',
          originalFileName: uploadedFileName || `Corrected_Manuscript_${submission.submissionNumber}.${isPdf ? 'pdf' : 'docx'}`,
          storageKey: uploadedFileKey,
          mimeType: isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileSize: uploadedFileSize || 0,
          isConfidential: true,
          uploadedById: user.id,
        },
      });

      // Insert single canonical version
      await tx.manuscriptVersion.create({
        data: {
          submissionId: submission.id,
          versionNumber: 1,
          title: title || submission.title,
          abstract: abstract || submission.abstract,
          changeSummary: responseToReviewers || 'Author uploaded corrected manuscript. Previous manuscript version force-deleted to maintain single version.',
          submittedById: user.id,
        },
      });

      // Determine new submission status
      const nextStatus = submission.status === 'REVISIONS_REQUESTED' ? 'REVISION_SUBMITTED' : submission.status;

      // Update submission details
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: nextStatus,
          title: title || submission.title,
          abstract: abstract || submission.abstract,
        },
      });
    });

    // Notify assigned editor
    if (submission.assignedEditorId) {
      await createNotification({
        userId: submission.assignedEditorId,
        type: 'REVISION_SUBMITTED',
        title: `Corrected Manuscript: ${submission.submissionNumber}`,
        message: `Author has re-uploaded a corrected manuscript for "${submission.title}". Previous file version was force-deleted to maintain single version.`,
        linkUrl: `/dashboard/editor`,
      });
    }

    // Also notify assigned reviewers if under review
    if (submission.reviewAssignments && submission.reviewAssignments.length > 0) {
      for (const rev of submission.reviewAssignments) {
        if (rev.reviewerId && rev.status !== 'COMPLETED') {
          await createNotification({
            userId: rev.reviewerId,
            type: 'STATUS_CHANGE',
            title: `Updated Manuscript: ${submission.submissionNumber}`,
            message: `The author has uploaded a corrected manuscript for manuscript "${submission.title}" for your ongoing assessment.`,
            linkUrl: `/dashboard/reviewer`,
          });
        }
      }
    }

    await logAuditEvent({
      userId: user.id,
      action: 'REUPLOAD_CORRECTED_MANUSCRIPT',
      entityType: 'SUBMISSION',
      entityId: submission.id,
      details: {
        fileName: uploadedFileName,
        singleVersionEnforced: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Corrected manuscript successfully uploaded. Previous version was force-deleted from database to maintain a single manuscript version.',
    });
  } catch (error: any) {
    console.error('Revision upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
