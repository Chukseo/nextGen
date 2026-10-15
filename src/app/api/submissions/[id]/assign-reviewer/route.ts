import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { isMasterAdmin, isEditor } from '@/lib/permissions';

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
    const { reviewerId, reviewerEmail, dueDateDays = 21 } = await req.json();

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { journal: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, submission.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to assign reviewers for this journal' }, { status: 403 });
    }

    let targetReviewer = null;
    if (reviewerId) {
      targetReviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
    } else if (reviewerEmail) {
      targetReviewer = await prisma.user.findUnique({ where: { email: reviewerEmail.toLowerCase().trim() } });
      if (!targetReviewer) {
        // Invite new user with REVIEWER role
        targetReviewer = await prisma.user.create({
          data: {
            email: reviewerEmail.toLowerCase().trim(),
            name: reviewerEmail.split('@')[0],
            roleAssignments: {
              create: [{ role: 'REVIEWER' }],
            },
          },
        });
      }
    }

    if (!targetReviewer) {
      return NextResponse.json({ error: 'Reviewer identity is required' }, { status: 400 });
    }

    // Authors cannot review their own submissions!
    if (targetReviewer.id === submission.authorId) {
      return NextResponse.json({ error: 'Author cannot be assigned as reviewer for their own manuscript.' }, { status: 400 });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(dueDateDays));

    const assignment = await prisma.reviewAssignment.create({
      data: {
        submissionId: submission.id,
        reviewerId: targetReviewer.id,
        editorId: user.id,
        status: 'INVITED',
        dueDate,
      },
    });

    // Update submission status to UNDER_REVIEW if not already
    if (submission.status === 'SUBMITTED' || submission.status === 'INITIAL_SCREENING' || submission.status === 'EDITOR_ASSIGNED') {
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: 'UNDER_REVIEW', assignedEditorId: user.id },
      });
    }

    // Notify reviewer
    await createNotification({
      userId: targetReviewer.id,
      type: 'REVIEW_INVITATION',
      title: `Review Invitation: ${submission.submissionNumber}`,
      message: `You have been invited by ${user.name || 'the Editor'} to review a manuscript for ${submission.journal.title}. Review due date: ${dueDate.toLocaleDateString()}.`,
      linkUrl: `/dashboard/reviewer`,
    });

    await logAuditEvent({
      userId: user.id,
      action: 'ASSIGN_REVIEWER',
      entityType: 'SUBMISSION',
      entityId: submission.id,
      details: {
        reviewerId: targetReviewer.id,
        reviewerEmail: targetReviewer.email,
        dueDate: dueDate.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      assignment,
      message: `Reviewer ${targetReviewer.name || targetReviewer.email} successfully assigned.`,
    });
  } catch (error: any) {
    console.error('Assign reviewer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
