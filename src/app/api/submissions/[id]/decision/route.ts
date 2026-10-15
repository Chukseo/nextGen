import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { isMasterAdmin, isEditor } from '@/lib/permissions';

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
    const { decision, rationale, commentsToAuthor, internalNotes } = body;

    if (!decision || !rationale) {
      return NextResponse.json({ error: 'Decision and rationale are required.' }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { journal: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Permission check: must be editor for this journal or master admin
    if (!isMasterAdmin(user) && !isEditor(user, submission.journalId)) {
      return NextResponse.json({ error: 'You are not authorized to make editorial decisions for this journal.' }, { status: 403 });
    }

    // Calculate new status
    let nextStatus = submission.status;
    let acceptedDate: Date | null = null;
    let rejectedDate: Date | null = null;

    switch (decision) {
      case 'DESK_REJECT':
      case 'REJECT':
        nextStatus = 'REJECTED';
        rejectedDate = new Date();
        break;
      case 'ACCEPT':
        nextStatus = 'ACCEPTED';
        acceptedDate = new Date();
        break;
      case 'MINOR_REVISION':
      case 'MAJOR_REVISION':
        nextStatus = 'REVISIONS_REQUESTED';
        break;
      case 'SEND_TO_REVIEW':
        nextStatus = 'UNDER_REVIEW';
        break;
      default:
        return NextResponse.json({ error: `Invalid decision type: ${decision}` }, { status: 400 });
    }

    const currentVersionNumber = submission.versions[0]?.versionNumber || 1;

    // Record decision and update submission status in transaction
    const result = await prisma.$transaction(async (tx) => {
      const decisionRecord = await tx.editorialDecision.create({
        data: {
          submissionId: submission.id,
          editorId: user.id,
          decision,
          rationale,
          commentsToAuthor,
          internalNotes,
          versionNumber: currentVersionNumber,
          decidedAt: new Date(),
        },
      });

      const updatedSub = await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: nextStatus,
          acceptedAt: acceptedDate || submission.acceptedAt,
          rejectedAt: rejectedDate || submission.rejectedAt,
          assignedEditorId: submission.assignedEditorId || user.id,
        },
      });

      return { decisionRecord, updatedSub };
    });

    // Notify author
    await createNotification({
      userId: submission.authorId,
      type: 'EDITORIAL_DECISION',
      title: `Editorial Decision: ${submission.submissionNumber} - ${decision.replace('_', ' ')}`,
      message: `An editorial decision has been rendered for "${submission.title}". Status: ${nextStatus}. Comments: ${commentsToAuthor || rationale}`,
      linkUrl: `/dashboard/author`,
    });

    // Log audit
    await logAuditEvent({
      userId: user.id,
      action: 'RECORD_EDITORIAL_DECISION',
      entityType: 'SUBMISSION',
      entityId: submission.id,
      details: {
        decision,
        previousStatus: submission.status,
        newStatus: nextStatus,
        submissionNumber: submission.submissionNumber,
      },
    });

    return NextResponse.json({
      success: true,
      decision: result.decisionRecord,
      newStatus: nextStatus,
      message: `Editorial decision ${decision} recorded successfully.`,
    });
  } catch (error: any) {
    console.error('Record decision error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
