import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const journals = await prisma.journal.findMany({
      include: {
        _count: {
          select: {
            submissions: true,
            issues: true,
            publishedArticles: true,
          },
        },
        editorialBoard: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ journals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMasterAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized: Master Admin privilege required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      slug,
      title,
      abbreviation,
      description,
      aimsScope,
      printIssn,
      onlineIssn,
      contactEmail,
      peerReviewPolicy,
      openAccessPolicy,
    } = body;

    if (!slug || !title || !contactEmail) {
      return NextResponse.json({ error: 'Slug, title, and contact email are required' }, { status: 400 });
    }

    const journal = await prisma.journal.create({
      data: {
        slug: slug.toLowerCase().trim(),
        title,
        abbreviation: abbreviation || title,
        description: description || '',
        aimsScope: aimsScope || '',
        printIssn,
        onlineIssn,
        contactEmail,
        peerReviewPolicy: peerReviewPolicy || 'Double-anonymous peer review',
        openAccessPolicy: openAccessPolicy || 'Open Access under CC BY 4.0',
      },
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'CREATE_JOURNAL',
      entityType: 'JOURNAL',
      entityId: journal.id,
      details: { title, slug },
    });

    return NextResponse.json({ success: true, journal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
