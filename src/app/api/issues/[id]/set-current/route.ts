import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

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
    const issueId = params.id;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { journal: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, issue.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to configure issues for this journal' }, { status: 403 });
    }

    // Atomic transaction: unset any current issue in this journal, set this one to current
    await prisma.$transaction([
      prisma.issue.updateMany({
        where: { journalId: issue.journalId },
        data: { isCurrent: false },
      }),
      prisma.issue.update({
        where: { id: issueId },
        data: { isCurrent: true },
      }),
    ]);

    await logAuditEvent({
      userId: user.id,
      action: 'SET_CURRENT_ISSUE',
      entityType: 'ISSUE',
      entityId: issueId,
      details: {
        journalId: issue.journalId,
        title: issue.title,
        issueNumber: issue.issueNumber,
        year: issue.year,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Issue "${issue.title}" is now the Current Issue for ${issue.journal.title}.`,
    });
  } catch (error: any) {
    console.error('Set current issue error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
