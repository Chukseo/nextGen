import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    // Check if any Master Admin exists
    const masterAdminCount = await prisma.userRoleAssignment.count({
      where: { role: 'MASTER_ADMIN' },
    });

    return NextResponse.json({
      isInitialized: masterAdminCount > 0,
      designatedEmailMasked: process.env.MASTER_ADMIN_EMAIL
        ? maskEmail(process.env.MASTER_ADMIN_EMAIL)
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, password, name, affiliation } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if master admin already exists
    const existingMasterAdmin = await prisma.userRoleAssignment.findFirst({
      where: { role: 'MASTER_ADMIN' },
    });

    if (existingMasterAdmin) {
      return NextResponse.json(
        { error: 'Master administrator has already been initialized. Bootstrap is permanently disabled.' },
        { status: 403 }
      );
    }

    // 2. Validate email against designated MASTER_ADMIN_EMAIL
    const designatedEmail = process.env.MASTER_ADMIN_EMAIL?.toLowerCase().trim();
    if (!designatedEmail || email.toLowerCase().trim() !== designatedEmail) {
      return NextResponse.json(
        { error: 'The provided email does not match the server-designated MASTER_ADMIN_EMAIL.' },
        { status: 403 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Administrator password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create or update user and assign MASTER_ADMIN role
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        name,
        passwordHash,
        affiliation,
      },
      create: {
        email: email.toLowerCase().trim(),
        name,
        passwordHash,
        affiliation,
      },
    });

    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role_journalId: {
          userId: user.id,
          role: 'MASTER_ADMIN',
          journalId: null as any,
        },
      },
      update: {},
      create: {
        userId: user.id,
        role: 'MASTER_ADMIN',
      },
    });

    // Also record flag in system settings
    await prisma.systemSetting.upsert({
      where: { key: 'MASTER_ADMIN_INITIALIZED' },
      update: { value: 'true' },
      create: {
        key: 'MASTER_ADMIN_INITIALIZED',
        value: 'true',
        description: 'First-run setup has been completed',
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'BOOTSTRAP_MASTER_ADMIN',
      entityType: 'USER',
      entityId: user.id,
      details: {
        email: user.email,
        timestamp: new Date().toISOString(),
        note: 'First-run master administrator initialized securely.',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Master administrator successfully initialized. Bootstrap is now permanently closed.',
    });
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.length > 2 ? local.substring(0, 2) : local.substring(0, 1);
  return `${visible}***@${domain}`;
}
