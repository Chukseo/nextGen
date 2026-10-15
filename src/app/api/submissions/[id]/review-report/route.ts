import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

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
      recommendation,
      commentsForAuthors,
      confidentialCommentsForEditors,
      rating,
      conflictOfInterestDeclared,
    } = body;

    if (!recommendation || !commentsForAuthors) {
      return NextResponse.json(
        { error: 'Review recommendation and comments for authors are required.' },
        { status: 400 }
      );
    }

    // Find active assignment for this reviewer
    const assignment = await prisma.reviewAssignment.findFirst({
      where: {
        submissionId,
        reviewerId: user.id,
      },
      include: {
        submission: { include: { journal: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'No active review assignment found for this manuscript.' },
        { status: 403 }
      );
    }

    // Create review report and update assignment status
    const report = await prisma.$transaction(async (tx) => {
      const rep = await tx.reviewReport.create({
        data: {
          reviewAssignmentId: assignment.id,
          recommendation,
          commentsForAuthors,
          confidentialCommentsForEditors,
          rating: rating ? Number(rating) : null,
          submittedAt: new Date(),
        },
      });

      await tx.reviewAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
          conflictOfInterestDeclared: Boolean(conflictOfInterestDeclared),
        },
      });

      return rep;
    });

    // Notify assigned editor
    if (assignment.editorId) {
      await createNotification({
        userId: assignment.editorId,
        type: 'REVIEW_REPORT_SUBMITTED',
        title: `Review Completed: ${assignment.submission.submissionNumber}`,
        message: `Reviewer has completed a peer review report with recommendation "${recommendation}".`,
        linkUrl: `/dashboard/editor`,
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: 'SUBMIT_REVIEW_REPORT',
      entityType: 'SUBMISSION',
      entityId: submissionId,
      details: {
        assignmentId: assignment.id,
        recommendation,
        rating,
      },
    });

    return NextResponse.json({
      success: true,
      report,
      message: 'Thank you for submitting your peer review report.',
    });
  } catch (error: any) {
    console.error('Submit review report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
