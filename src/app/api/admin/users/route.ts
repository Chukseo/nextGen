import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

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

    try {
      await sendWelcomeEmail({
        toEmail: user.email,
        name: user.name || undefined,
      });
    } catch (emailErr) {
      console.error('Failed to send welcome email to admin-created user:', emailErr);
    }

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

    const { userId, isActive, newRole, journalId, removeRoleId, replaceRoles } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent modifying your own master admin status
    const adminUser = session.user as any;
    if (userId === adminUser.id && (isActive === false || replaceRoles)) {
      return NextResponse.json({ error: 'Cannot modify your own admin account from this interface.' }, { status: 400 });
    }

    // Update active status if provided
    if (isActive !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });
    }

    // Replace all roles (bulk role change)
    if (replaceRoles && Array.isArray(replaceRoles)) {
      // Delete all existing role assignments
      await prisma.userRoleAssignment.deleteMany({
        where: { userId },
      });

      // Create new ones
      if (replaceRoles.length > 0) {
        await prisma.userRoleAssignment.createMany({
          data: replaceRoles.map((r: { role: string; journalId?: string }) => ({
            userId,
            role: r.role,
            journalId: r.journalId || null,
          })),
        });
      }

      await logAuditEvent({
        userId: adminUser.id,
        action: 'REPLACE_USER_ROLES',
        entityType: 'USER',
        entityId: userId,
        details: { replaceRoles },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { roleAssignments: { include: { journal: { select: { title: true, slug: true } } } } },
      });

      return NextResponse.json({ success: true, user: updatedUser, message: 'User roles updated successfully.' });
    }

    // Remove a specific role assignment by ID
    if (removeRoleId) {
      await prisma.userRoleAssignment.delete({
        where: { id: removeRoleId },
      });

      await logAuditEvent({
        userId: adminUser.id,
        action: 'REMOVE_USER_ROLE',
        entityType: 'USER',
        entityId: userId,
        details: { removedRoleAssignmentId: removeRoleId },
      });

      return NextResponse.json({ success: true, message: 'Role removed.' });
    }

    // Add a new role
    if (newRole) {
      // Check for duplicate
      const existing = await prisma.userRoleAssignment.findFirst({
        where: {
          userId,
          role: newRole,
          journalId: journalId || null,
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'This user already has this role assignment.' }, { status: 400 });
      }

      await prisma.userRoleAssignment.create({
        data: {
          userId,
          role: newRole,
          journalId: journalId || null,
        },
      });

      await logAuditEvent({
        userId: adminUser.id,
        action: 'ADD_USER_ROLE',
        entityType: 'USER',
        entityId: userId,
        details: { newRole, journalId },
      });

      return NextResponse.json({ success: true, message: `Role ${newRole} added.` });
    }

    await logAuditEvent({
      userId: adminUser.id,
      action: isActive === false ? 'SUSPEND_USER' : 'UPDATE_USER',
      entityType: 'USER',
      entityId: userId,
      details: { isActive },
    });

    return NextResponse.json({ success: true, message: 'User updated.' });
  } catch (error: any) {
    console.error('PATCH /api/admin/users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMasterAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized: Master Administrator privilege required.' }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const adminUser = session.user as any;

    // Prevent self-deletion
    if (userId === adminUser.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            submissions: true,
            reviewAssignments: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Delete in order: role assignments, review reports, review assignments, editorial decisions,
    // co-author entries, audit events, submission files, DOI records, published articles,
    // submissions, accounts, sessions, then user
    await prisma.$transaction(async (tx) => {
      // Delete role assignments
      await tx.userRoleAssignment.deleteMany({ where: { userId } });

      // Delete review reports linked to this user's review assignments
      const reviewAssignmentIds = (await tx.reviewAssignment.findMany({
        where: { reviewerId: userId },
        select: { id: true },
      })).map(ra => ra.id);

      if (reviewAssignmentIds.length > 0) {
        await tx.reviewReport.deleteMany({
          where: { reviewAssignmentId: { in: reviewAssignmentIds } },
        });
      }

      // Delete review assignments where user was reviewer or assigning editor
      await tx.reviewAssignment.deleteMany({ where: { OR: [{ reviewerId: userId }, { editorId: userId }] } });

      // Delete editorial decisions made by this user
      await tx.editorialDecision.deleteMany({ where: { editorId: userId } });

      // Delete files uploaded by this user
      await tx.manuscriptFile.deleteMany({ where: { uploadedById: userId } });

      // Delete discussion messages sent by this user
      await tx.discussionMessage.deleteMany({ where: { senderId: userId } });

      // For submissions authored by this user, clean up dependent records
      const submissionIds = (await tx.submission.findMany({
        where: { authorId: userId },
        select: { id: true },
      })).map(s => s.id);

      if (submissionIds.length > 0) {
        // Delete review reports on these submissions
        const subReviewIds = (await tx.reviewAssignment.findMany({
          where: { submissionId: { in: submissionIds } },
          select: { id: true },
        })).map(ra => ra.id);

        if (subReviewIds.length > 0) {
          await tx.reviewReport.deleteMany({
            where: { reviewAssignmentId: { in: subReviewIds } },
          });
        }

        await tx.reviewAssignment.deleteMany({ where: { submissionId: { in: submissionIds } } });
        await tx.editorialDecision.deleteMany({ where: { submissionId: { in: submissionIds } } });
        await tx.submissionAuthor.deleteMany({ where: { submissionId: { in: submissionIds } } });
        await tx.manuscriptFile.deleteMany({ where: { submissionId: { in: submissionIds } } });
        await tx.manuscriptVersion.deleteMany({ where: { submissionId: { in: submissionIds } } });
        await tx.discussionMessage.deleteMany({ where: { submissionId: { in: submissionIds } } });
        await tx.publishedArticle.deleteMany({ where: { submissionId: { in: submissionIds } } });
        await tx.dOIRecord.deleteMany({ where: { submissionId: { in: submissionIds } } });
        await tx.submission.deleteMany({ where: { authorId: userId } });
      }

      // Delete audit events by this user
      await tx.auditEvent.deleteMany({ where: { userId } });

      // Delete editorial board member assignments
      await tx.editorialBoardMember.deleteMany({ where: { userId } });

      // Delete NextAuth linked accounts and sessions
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    await logAuditEvent({
      userId: adminUser.id,
      action: 'DELETE_USER',
      entityType: 'USER',
      entityId: userId,
      details: {
        deletedEmail: targetUser.email,
        deletedName: targetUser.name,
        hadSubmissions: targetUser._count.submissions,
        hadReviews: targetUser._count.reviewAssignments,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User "${targetUser.name || targetUser.email}" and all associated records have been permanently deleted.`,
    });
  } catch (error: any) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
