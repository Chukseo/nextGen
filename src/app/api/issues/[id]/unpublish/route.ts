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
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { journal: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, issue.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to unpublish this issue' }, { status: 403 });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: params.id },
      data: {
        status: 'DRAFT',
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'UNPUBLISH_ISSUE',
      entityType: 'ISSUE',
      entityId: issue.id,
      details: {
        title: issue.title,
        journalId: issue.journalId,
      },
    });

    return NextResponse.json({
      success: true,
      issue: updatedIssue,
      message: `Issue "${issue.title}" has been unpublished and reverted to Draft.`,
    });
  } catch (error: any) {
    console.error('Unpublish issue error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
