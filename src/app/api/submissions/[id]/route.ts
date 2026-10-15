import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';

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
