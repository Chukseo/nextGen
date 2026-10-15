import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const journalSlug = searchParams.get('journal');
    const status = searchParams.get('status');

    let where: any = {};
    if (journalSlug) {
      where.journal = { slug: journalSlug };
    }
    if (status) {
      where.status = status;
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        journal: { select: { title: true, slug: true, abbreviation: true } },
        volume: true,
        publishedArticles: {
          include: {
            submission: {
              include: { coAuthors: { orderBy: { authorOrder: 'asc' } } },
            },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { issueNumber: 'desc' }],
    });

    return NextResponse.json({ issues });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const {
      journalId,
      volumeNumber,
      year,
      issueNumber,
      title,
      description,
      status = 'DRAFT',
      scheduledPublishDate,
      editorialIntroduction,
    } = body;

    if (!journalId || !issueNumber || !year || !title) {
      return NextResponse.json({ error: 'Missing required issue fields' }, { status: 400 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, journalId)) {
      return NextResponse.json({ error: 'Unauthorized to manage issues for this journal' }, { status: 403 });
    }

    // Find or create volume
    let volume = await prisma.volume.findFirst({
      where: {
        journalId,
        volumeNumber: Number(volumeNumber || 1),
      },
    });

    if (!volume) {
      volume = await prisma.volume.create({
        data: {
          journalId,
          volumeNumber: Number(volumeNumber || 1),
          year: Number(year),
          title: `Volume ${volumeNumber || 1} (${year})`,
        },
      });
    }

    // Create issue
    const issue = await prisma.issue.create({
      data: {
        journalId,
        volumeId: volume.id,
        issueNumber: Number(issueNumber),
        year: Number(year),
        title,
        description,
        status,
        scheduledPublishDate: scheduledPublishDate ? new Date(scheduledPublishDate) : null,
        publicationDate: status === 'PUBLISHED' ? new Date() : null,
        editorialIntroduction,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'CREATE_ISSUE',
      entityType: 'ISSUE',
      entityId: issue.id,
      details: {
        journalId,
        volumeNumber,
        issueNumber,
        title,
        status,
      },
    });

    return NextResponse.json({ success: true, issue });
  } catch (error: any) {
    console.error('Create issue error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
