import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { deleteFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        journal: true,
        coAuthors: { orderBy: { authorOrder: 'asc' } },
        files: { orderBy: { createdAt: 'desc' } },
        versions: { orderBy: { versionNumber: 'desc' } },
        editorialDecisions: {
          include: { editor: { select: { name: true, email: true } } },
          orderBy: { decidedAt: 'desc' },
        },
        reviewAssignments: {
          include: {
            reviewer: { select: { id: true, name: true, email: true, affiliation: true } },
            report: true,
          },
        },
        doiRecord: {
          include: { depositAttempts: { orderBy: { attemptedAt: 'desc' } } },
        },
        publishedArticle: {
          include: { issue: { include: { volume: true } } },
        },
        discussions: {
          include: { sender: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const hasAdminOrEditorAccess = isMasterAdmin(user) || isEditor(user, submission.journalId);
    const isAuthor = submission.authorId === user.id;
    const reviewerAssignment = submission.reviewAssignments.find((r) => r.reviewerId === user.id);

    if (!hasAdminOrEditorAccess && !isAuthor && !reviewerAssignment) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Double-blind anonymization for reviewers
    if (reviewerAssignment && !hasAdminOrEditorAccess) {
      if (submission.reviewModel === 'DOUBLE_ANONYMOUS') {
        // Strip author identity for reviewer
        const anonymizedSubmission = {
          ...submission,
          coAuthors: [],
          author: { name: 'Anonymous Author', affiliation: '[Redacted for Double-Anonymous Peer Review]' },
          // Hide other reviewer reports
          reviewAssignments: submission.reviewAssignments
            .filter((r) => r.reviewerId === user.id)
            .map((r) => ({
              ...r,
              reviewer: { name: 'You (Reviewer)', email: '' },
            })),
          editorialDecisions: submission.editorialDecisions.map((d) => ({
            ...d,
            internalNotes: null,
          })),
        };
        return NextResponse.json({ submission: anonymizedSubmission });
      }
    }

    // For authors: hide confidential comments and reviewer identities (unless open review)
    if (isAuthor && !hasAdminOrEditorAccess) {
      const sanitizedSubmission = {
        ...submission,
        reviewAssignments: submission.reviewAssignments
          .filter((r) => r.status === 'COMPLETED')
          .map((r, index) => ({
            id: r.id,
            status: r.status,
            dueDate: r.dueDate,
            reviewer: {
              name: submission.reviewModel === 'OPEN' ? r.reviewer.name : `Reviewer ${index + 1}`,
              affiliation: submission.reviewModel === 'OPEN' ? r.reviewer.affiliation : '',
            },
            report: r.report
              ? {
                  recommendation: r.report.recommendation,
                  commentsForAuthors: r.report.commentsForAuthors,
                  rating: r.report.rating,
                  submittedAt: r.report.submittedAt,
                  confidentialCommentsForEditors: null, // Hidden from author
                }
              : null,
          })),
        editorialDecisions: submission.editorialDecisions.map((d) => ({
          ...d,
          internalNotes: null, // Hidden from author
        })),
        files: submission.files.filter((f) => !f.isConfidential),
      };
      return NextResponse.json({ submission: sanitizedSubmission });
    }

    return NextResponse.json({ submission });
  } catch (error: any) {
    console.error('Fetch submission detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { journal: true, coAuthors: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const hasAdminOrEditorAccess = isMasterAdmin(user) || isEditor(user, submission.journalId);
    const isAuthor = submission.authorId === user.id;

    if (!hasAdminOrEditorAccess && !isAuthor) {
      return NextResponse.json({ error: 'Unauthorized to modify this submission' }, { status: 403 });
    }

    // Authors cannot edit if already published
    if (isAuthor && !hasAdminOrEditorAccess && submission.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Published submissions cannot be edited directly. Contact the editorial office.' },
        { status: 400 }
      );
    }

    const {
      title,
      subtitle,
      abstract,
      articleType,
      discipline,
      keywords,
      conflictOfInterest,
      ethicsStatement,
      fundingInfo,
      dataAvailability,
      consentStatement,
      acknowledgements,
      coverLetter,
      coAuthors,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      // If coAuthors array is provided, replace author entries
      if (Array.isArray(coAuthors) && coAuthors.length > 0) {
        await tx.submissionAuthor.deleteMany({ where: { submissionId: submission.id } });
        await tx.submissionAuthor.createMany({
          data: coAuthors.map((author: any, idx: number) => ({
            submissionId: submission.id,
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
            affiliation: author.affiliation,
            country: author.country || null,
            orcid: author.orcid || null,
            isCorresponding: Boolean(author.isCorresponding),
            authorOrder: author.authorOrder || idx + 1,
            bio: author.bio || null,
          })),
        });
      }

      const updatedSub = await tx.submission.update({
        where: { id: submission.id },
        data: {
          ...(title && { title }),
          ...(subtitle !== undefined && { subtitle }),
          ...(abstract && { abstract }),
          ...(articleType && { articleType }),
          ...(discipline && { discipline }),
          ...(keywords && { keywords }),
          ...(conflictOfInterest !== undefined && { conflictOfInterest }),
          ...(ethicsStatement !== undefined && { ethicsStatement }),
          ...(fundingInfo !== undefined && { fundingInfo }),
          ...(dataAvailability !== undefined && { dataAvailability }),
          ...(consentStatement !== undefined && { consentStatement }),
          ...(acknowledgements !== undefined && { acknowledgements }),
          ...(coverLetter !== undefined && { coverLetter }),
        },
        include: {
          coAuthors: { orderBy: { authorOrder: 'asc' } },
          files: true,
        },
      });

      return updatedSub;
    });

    await logAuditEvent({
      userId: user.id,
      action: 'UPDATE_SUBMISSION_METADATA',
      entityType: 'SUBMISSION',
      entityId: submission.id,
      details: {
        title: updated.title,
        updatedFields: Object.keys(body),
      },
    });

    return NextResponse.json({
      success: true,
      submission: updated,
      message: 'Submission details updated successfully.',
    });
  } catch (error: any) {
    console.error('Update submission error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        journal: true,
        files: true,
        publishedArticle: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const hasAdminOrEditorAccess = isMasterAdmin(user) || isEditor(user, submission.journalId);
    const isAuthor = submission.authorId === user.id;

    if (!hasAdminOrEditorAccess && !isAuthor) {
      return NextResponse.json({ error: 'Unauthorized to delete this submission' }, { status: 403 });
    }

    // Authors can only delete before acceptance or publishing
    if (isAuthor && !hasAdminOrEditorAccess && (submission.status === 'PUBLISHED' || submission.status === 'ACCEPTED')) {
      return NextResponse.json(
        { error: 'Cannot delete an accepted or published submission. Please contact editorial support.' },
        { status: 400 }
      );
    }

    // Delete files from storage
    for (const f of submission.files) {
      if (f.storageKey) {
        const bucket = f.fileType === 'FINAL_TYPESET_PDF' ? 'published-articles' : 'manuscripts-private';
        await deleteFile(f.storageKey, bucket);
      }
    }

    // Perform cascade deletion in database
    await prisma.$transaction(async (tx) => {
      if (submission.publishedArticle) {
        await tx.publishedArticle.delete({ where: { id: submission.publishedArticle.id } });
      }
      await tx.manuscriptFile.deleteMany({ where: { submissionId } });
      await tx.manuscriptVersion.deleteMany({ where: { submissionId } });
      await tx.submissionAuthor.deleteMany({ where: { submissionId } });
      await tx.reviewAssignment.deleteMany({ where: { submissionId } });
      await tx.editorialDecision.deleteMany({ where: { submissionId } });
      await tx.dOIRecord.deleteMany({ where: { submissionId } });
      await tx.submission.delete({ where: { id: submissionId } });
    });

    await logAuditEvent({
      userId: user.id,
      action: 'DELETE_SUBMISSION',
      entityType: 'SUBMISSION',
      entityId: submissionId,
      details: { title: submission.title, submissionNumber: submission.submissionNumber },
    });

    return NextResponse.json({
      success: true,
      message: 'Submission successfully deleted.',
    });
  } catch (error: any) {
    console.error('Delete submission error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

