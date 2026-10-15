import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

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

    if (!uploadedFileKey || !responseToReviewers) {
      return NextResponse.json(
        { error: 'Revised Word document and detailed response to reviewers are required.' },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        journal: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.authorId !== user.id) {
      return NextResponse.json({ error: 'Only the submitting author can upload revisions.' }, { status: 403 });
    }

    if (submission.status !== 'REVISIONS_REQUESTED') {
      return NextResponse.json(
        { error: `Cannot submit revision when status is "${submission.status}". Revisions must be requested by the editor first.` },
        { status: 400 }
      );
    }

    const nextVersionNumber = (submission.versions[0]?.versionNumber || 1) + 1;

    // Create new immutable version and file
    await prisma.$transaction(async (tx) => {
      // 1. Create ManuscriptFile
      await tx.manuscriptFile.create({
        data: {
          submissionId: submission.id,
          versionNumber: nextVersionNumber,
          fileType: 'REVISION',
          originalFileName: uploadedFileName || `Revision_v${nextVersionNumber}.docx`,
          storageKey: uploadedFileKey,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileSize: uploadedFileSize || 0,
          isConfidential: true,
          uploadedById: user.id,
        },
      });

      // 2. Create ManuscriptVersion
      await tx.manuscriptVersion.create({
        data: {
          submissionId: submission.id,
          versionNumber: nextVersionNumber,
          title: title || submission.title,
          abstract: abstract || submission.abstract,
          changeSummary: responseToReviewers,
          submittedById: user.id,
        },
      });

      // 3. Update Submission status
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: 'REVISION_SUBMITTED',
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
        title: `Revision Submitted: ${submission.submissionNumber} (v${nextVersionNumber})`,
        message: `Author has submitted revision v${nextVersionNumber} and point-by-point response for "${submission.title}".`,
        linkUrl: `/dashboard/editor`,
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: 'UPLOAD_REVISION',
      entityType: 'SUBMISSION',
      entityId: submission.id,
      details: {
        versionNumber: nextVersionNumber,
        fileName: uploadedFileName,
      },
    });

    return NextResponse.json({
      success: true,
      versionNumber: nextVersionNumber,
      message: `Revision v${nextVersionNumber} successfully uploaded. Editorial team has been notified.`,
    });
  } catch (error: any) {
    console.error('Revision upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
