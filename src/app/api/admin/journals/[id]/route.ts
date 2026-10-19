import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const journal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
      include: {
        _count: {
          select: {
            submissions: true,
            issues: true,
            publishedArticles: true,
          },
        },
        editorialBoard: {
          include: { user: { select: { name: true, email: true, affiliation: true } } },
        },
      },
    });

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    return NextResponse.json({ journal });
  } catch (error: any) {
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
    const targetJournal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
    });

    if (!targetJournal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    let isAuthorized = isMasterAdmin(user) || isEditor(user, targetJournal.id);
    if (!isAuthorized && user?.id) {
      const dbRoles = await prisma.userRoleAssignment.findMany({ where: { userId: user.id } });
      const hasAdmin = dbRoles.some(r => r.role === 'MASTER_ADMIN' || r.role === 'JOURNAL_MANAGER');
      const hasEditor = dbRoles.some(
        r => (r.role === 'EDITOR' || r.role === 'SECTION_EDITOR') && (!r.journalId || r.journalId === targetJournal.id)
      );
      isAuthorized = hasAdmin || hasEditor;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to update this journal' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      abbreviation,
      description,
      aimsScope,
      printIssn,
      onlineIssn,
      contactEmail,
      peerReviewPolicy,
      openAccessPolicy,
      licensingPolicy,
      apcInfo,
      coverImageUrl,
      logoUrl,
      aboutDetails,
      privacyStatement,
      contactDetails,
      authorGuidelines,
      isActive,
    } = body;

    const updated = await prisma.journal.update({
      where: { id: targetJournal.id },
      data: {
        ...(title && { title }),
        ...(abbreviation && { abbreviation }),
        ...(description !== undefined && { description }),
        ...(aimsScope !== undefined && { aimsScope }),
        ...(printIssn !== undefined && { printIssn }),
        ...(onlineIssn !== undefined && { onlineIssn }),
        ...(contactEmail && { contactEmail }),
        ...(peerReviewPolicy && { peerReviewPolicy }),
        ...(openAccessPolicy && { openAccessPolicy }),
        ...(licensingPolicy && { licensingPolicy }),
        ...(apcInfo !== undefined && { apcInfo }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(aboutDetails !== undefined && { aboutDetails }),
        ...(privacyStatement !== undefined && { privacyStatement }),
        ...(contactDetails !== undefined && { contactDetails }),
        ...(authorGuidelines !== undefined && { authorGuidelines }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'UPDATE_JOURNAL',
      entityType: 'JOURNAL',
      entityId: targetJournal.id,
      details: { title: updated.title, updatedFields: Object.keys(body) },
    });

    return NextResponse.json({
      success: true,
      journal: updated,
      message: 'Journal details and cover updated successfully.',
    });
  } catch (error: any) {
    console.error('Update journal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMasterAdmin((session.user as any))) {
      return NextResponse.json({ error: 'Master Admin privileges required' }, { status: 403 });
    }

    const targetJournal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
    });

    if (!targetJournal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    await prisma.journal.delete({
      where: { id: targetJournal.id },
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'DELETE_JOURNAL',
      entityType: 'JOURNAL',
      entityId: targetJournal.id,
      details: { title: targetJournal.title },
    });

    return NextResponse.json({
      success: true,
      message: `Journal "${targetJournal.title}" has been deleted.`,
    });
  } catch (error: any) {
    console.error('Delete journal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
