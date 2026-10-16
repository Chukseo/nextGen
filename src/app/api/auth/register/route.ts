import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, affiliation, orcid } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters in length.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL?.toLowerCase().trim();
    const isDesignatedAdmin = masterAdminEmail && cleanEmail === masterAdminEmail;

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        affiliation: affiliation?.trim() || null,
        orcid: orcid?.trim() || null,
        passwordHash,
        roleAssignments: {
          create: isDesignatedAdmin
            ? [
                { role: 'MASTER_ADMIN' },
                { role: 'AUTHOR' },
              ]
            : [
                { role: 'AUTHOR' },
                { role: 'READER' },
              ],
        },
      },
    });

    // Send Welcome Email
    try {
      await sendWelcomeEmail({
        toEmail: user.email,
        name: user.name || undefined,
      });
    } catch (emailErr) {
      console.error('Failed to send welcome email upon registration:', emailErr);
    }

    // Log Audit Event
    await logAuditEvent({
      userId: user.id,
      action: 'USER_REGISTER',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, method: 'credentials_signup' },
    });

    return NextResponse.json({
      success: true,
      message: 'Scholar account created successfully. You may now sign in.',
      userId: user.id,
    });
  } catch (error: any) {
    console.error('Registration route error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during account creation.' },
      { status: 500 }
    );
  }
}
