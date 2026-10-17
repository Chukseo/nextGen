import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

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
          orderBy: { displayOrder: 'asc' },
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

    if (!isMasterAdmin(user) && !isEditor(user, journal.id)) {
      return NextResponse.json({ error: 'Admin or Editor privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, name, email, roleTitle, affiliation, orcid, displayOrder } = body;

    if (!roleTitle || !affiliation) {
      return NextResponse.json({ error: 'Role title and affiliation are required' }, { status: 400 });
    }

    let targetUserId = userId;

    if (!targetUserId) {
      if (!name || !email) {
        return NextResponse.json({ error: 'Either select an existing user or provide name and email' }, { status: 400 });
      }

      // Find or create user
      let existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!existingUser) {
        const tempPassword = await bcrypt.hash('NextGenBoard2026!', 10);
        existingUser = await prisma.user.create({
          data: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash: tempPassword,
            affiliation: affiliation.trim(),
            orcid: orcid?.trim() || null,
            roleAssignments: {
              create: [
                { role: 'EDITOR', journalId: journal.id },
              ],
            },
          },
        });
      }

      targetUserId = existingUser.id;
    }

    // Determine display order
    let order = typeof displayOrder === 'number' ? displayOrder : 0;
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
        affiliation: affiliation.trim(),
        displayOrder: order,
      },
      create: {
        journalId: journal.id,
        userId: targetUserId,
        roleTitle: roleTitle.trim(),
        affiliation: affiliation.trim(),
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

    return NextResponse.json({
      success: true,
      message: `${member.user.name} added to Editorial Board as ${member.roleTitle}.`,
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

    if (!isMasterAdmin(user) && !isEditor(user, journal.id)) {
      return NextResponse.json({ error: 'Admin or Editor privileges required' }, { status: 403 });
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

    if (!isMasterAdmin(user) && !isEditor(user, journal.id)) {
      return NextResponse.json({ error: 'Admin or Editor privileges required' }, { status: 403 });
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
