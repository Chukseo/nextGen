import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function checkJournalAuthorization(user: any, journalId: string): Promise<boolean> {
  if (!user || !user.id) return false;
  if (isMasterAdmin(user) || isEditor(user, journalId)) return true;

  // Fresh database check in case session token is stale
  try {
    const dbRoles = await prisma.userRoleAssignment.findMany({
      where: { userId: user.id },
    });
    const hasAdmin = dbRoles.some(r => r.role === 'MASTER_ADMIN' || r.role === 'JOURNAL_MANAGER');
    if (hasAdmin) return true;

    return dbRoles.some(
      r => (r.role === 'EDITOR' || r.role === 'SECTION_EDITOR') && (!r.journalId || r.journalId === journalId)
    );
  } catch (err) {
    console.error('Database role check error:', err);
    return false;
  }
}

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
        editorialBoard: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                affiliation: true,
                orcid: true,
                country: true,
              },
            },
          },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      journalId: journal.id,
      journalTitle: journal.title,
      editorialBoard: journal.editorialBoard,
    });
  } catch (error: any) {
    console.error('Fetch editorial board error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const journal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
    });

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    const isAuthorized = await checkJournalAuthorization(user, journal.id);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Administrator or Journal Editor privileges required.' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, name, email, roleTitle, affiliation, orcid, displayOrder } = body;

    if (!roleTitle || !roleTitle.trim()) {
      return NextResponse.json({ error: 'Editorial role title is required.' }, { status: 400 });
    }

    let targetUserId = userId;
    let targetName = name?.trim();
    let targetEmail = email?.toLowerCase().trim();
    let targetAffiliation = affiliation?.trim() || 'Academic Research Institution';
    let targetOrcid = orcid?.trim() || null;

    if (targetUserId) {
      const userById = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (userById) {
        targetName = targetName || userById.name || 'Scholar Member';
        targetEmail = targetEmail || userById.email;
        targetAffiliation = targetAffiliation || userById.affiliation || 'Academic Research Institution';
        targetOrcid = targetOrcid || userById.orcid;

        // Ensure user has EDITOR role assignment for this journal
        const hasRole = await prisma.userRoleAssignment.findFirst({
          where: { userId: targetUserId, role: 'EDITOR', journalId: journal.id },
        });
        if (!hasRole) {
          await prisma.userRoleAssignment.create({
            data: { userId: targetUserId, role: 'EDITOR', journalId: journal.id },
          }).catch(() => {});
        }
      }
    } else if (targetEmail) {
      let existingUser = await prisma.user.findUnique({
        where: { email: targetEmail },
      });

      if (!existingUser) {
        const tempPassword = await bcrypt.hash('NextGenBoard2026!', 10);
        existingUser = await prisma.user.create({
          data: {
            name: targetName || 'Scholar Member',
            email: targetEmail,
            passwordHash: tempPassword,
            affiliation: targetAffiliation,
            orcid: targetOrcid,
            roleAssignments: {
              create: [
                { role: 'EDITOR', journalId: journal.id },
              ],
            },
          },
        });
      } else {
        // Update user profile info
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            ...(targetName && { name: targetName }),
            ...(targetOrcid && { orcid: targetOrcid }),
            ...(targetAffiliation && { affiliation: targetAffiliation }),
          },
        });

        // Ensure user has EDITOR role assignment for this journal
        const hasRole = await prisma.userRoleAssignment.findFirst({
          where: { userId: existingUser.id, role: 'EDITOR', journalId: journal.id },
        });
        if (!hasRole) {
          await prisma.userRoleAssignment.create({
            data: { userId: existingUser.id, role: 'EDITOR', journalId: journal.id },
          }).catch(() => {});
        }
      }

      targetUserId = existingUser.id;
    } else {
      return NextResponse.json({ error: 'Please choose an existing user or enter scholar name and email.' }, { status: 400 });
    }

    // Determine display order
    let order = typeof displayOrder === 'number' && displayOrder > 0 ? displayOrder : 0;
    if (order === 0) {
      const highest = await prisma.editorialBoardMember.findFirst({
        where: { journalId: journal.id },
        orderBy: { displayOrder: 'desc' },
      });
      order = (highest?.displayOrder || 0) + 1;
    }

    const member = await prisma.editorialBoardMember.upsert({
      where: {
        journalId_userId_roleTitle: {
          journalId: journal.id,
          userId: targetUserId,
          roleTitle: roleTitle.trim(),
        },
      },
      update: {
        affiliation: targetAffiliation,
        displayOrder: order,
      },
      create: {
        journalId: journal.id,
        userId: targetUserId,
        roleTitle: roleTitle.trim(),
        affiliation: targetAffiliation,
        displayOrder: order,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            affiliation: true,
            orcid: true,
          },
        },
      },
    });

    const isEic = roleTitle.toLowerCase().includes('editor-in-chief') || roleTitle.toLowerCase().includes('chief');
    if (isEic && member.user?.email) {
      await prisma.journal.update({
        where: { id: journal.id },
        data: { contactEmail: member.user.email },
      }).catch((err) => console.error('Failed to sync contactEmail:', err));
    }

    return NextResponse.json({
      success: true,
      message: `${member.user.name || 'Scholar'} appointed to Editorial Board as ${member.roleTitle}.`,
      member,
    });
  } catch (error: any) {
    console.error('Add editorial board member error:', error);
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
    const journal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
    });

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    const isAuthorized = await checkJournalAuthorization(user, journal.id);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Administrator or Journal Editor privileges required.' }, { status: 403 });
    }

    const body = await req.json();
    const { memberId, roleTitle, affiliation, displayOrder, name, orcid } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const updated = await prisma.editorialBoardMember.update({
      where: { id: memberId },
      data: {
        ...(roleTitle && { roleTitle: roleTitle.trim() }),
        ...(affiliation && { affiliation: affiliation.trim() }),
        ...(typeof displayOrder === 'number' && { displayOrder }),
      },
      include: {
        user: true,
      },
    });

    // Optionally update user name or orcid if provided
    if (name || orcid !== undefined) {
      await prisma.user.update({
        where: { id: updated.userId },
        data: {
          ...(name && { name: name.trim() }),
          ...(orcid !== undefined && { orcid: orcid ? orcid.trim() : null }),
        },
      });
    }

    const isEic = updated.roleTitle.toLowerCase().includes('editor-in-chief') || updated.roleTitle.toLowerCase().includes('chief');
    if (isEic && updated.user?.email) {
      await prisma.journal.update({
        where: { id: journal.id },
        data: { contactEmail: updated.user.email },
      }).catch((err) => console.error('Failed to sync contactEmail:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Editorial board member updated successfully.',
      member: updated,
    });
  } catch (error: any) {
    console.error('Update editorial board member error:', error);
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
    const journal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
    });

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    const isAuthorized = await checkJournalAuthorization(user, journal.id);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Administrator or Journal Editor privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'memberId query parameter is required' }, { status: 400 });
    }

    await prisma.editorialBoardMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed from Editorial Board.',
    });
  } catch (error: any) {
    console.error('Delete editorial board member error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
