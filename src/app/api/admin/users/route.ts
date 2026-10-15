import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMasterAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized: Master Administrator privilege required.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        roleAssignments: {
          include: { journal: { select: { title: true, slug: true } } },
        },
        _count: {
          select: {
            submissions: true,
            reviewAssignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMasterAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, name, role, journalId, affiliation, tempPassword } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(tempPassword || 'NextGen2026!', 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name || email.split('@')[0],
        affiliation,
        passwordHash,
        roleAssignments: {
          create: [
            {
              role,
              journalId: journalId || null,
            },
          ],
        },
      },
      include: { roleAssignments: true },
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'CREATE_USER_ACCOUNT',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, role, journalId },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMasterAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, isActive, newRole, journalId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    if (newRole) {
      await prisma.userRoleAssignment.create({
        data: {
          userId,
          role: newRole,
          journalId: journalId || null,
        },
      });
    }

    await logAuditEvent({
      userId: (session.user as any).id,
      action: isActive === false ? 'SUSPEND_USER' : 'UPDATE_USER_ROLE',
      entityType: 'USER',
      entityId: userId,
      details: { isActive, newRole, journalId },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
