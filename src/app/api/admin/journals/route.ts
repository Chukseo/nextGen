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
      coverImageUrl,
      logoUrl,
    } = body;

    if (!slug || !title || !contactEmail) {
      return NextResponse.json({ error: 'Slug, title, and contact email are required' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const resolvedPublisher = body.publisher || 'NextGen Research and Innovation Press';
    const resolvedPeerReview = peerReviewPolicy || 'Rigorous double-anonymous peer review conducted by independent domain experts. Minimum two review reports required prior to editorial decision.';
    const resolvedOpenAccess = openAccessPolicy || 'Diamond Open Access: immediate and unrestricted global access with no fees for readers or authors under CC BY 4.0.';
    const resolvedLicensing = body.licensingPolicy || 'Creative Commons Attribution 4.0 International (CC BY 4.0)';
    const resolvedApc = body.apcInfo || 'All article processing charges (APCs) are fully sponsored by NextGen Press Foundation for the current publishing year.';
    const resolvedAims = aimsScope || `${title} publishes original peer-reviewed research, comprehensive literature reviews, and technical notes spanning foundational theory, experimental benchmarks, and applied innovations.`;

    const adminUser = session.user as any;

    const journal = await prisma.$transaction(async (tx) => {
      // 1. Create Journal
      const createdJournal = await tx.journal.create({
        data: {
          slug: cleanSlug,
          title,
          abbreviation: abbreviation || title,
          description: description || `Official peer-reviewed open access academic publication under NextGen Press.`,
          aimsScope: resolvedAims,
          publisher: resolvedPublisher,
          licensingPolicy: resolvedLicensing,
          openAccessPolicy: resolvedOpenAccess,
          apcInfo: resolvedApc,
          peerReviewPolicy: resolvedPeerReview,
          printIssn: printIssn || null,
          onlineIssn: onlineIssn || null,
          contactEmail,
          coverImageUrl: coverImageUrl || null,
          logoUrl: logoUrl || null,
        },
      });

      // 2. Initialize Volume 1
      const volume1 = await tx.volume.create({
        data: {
          journalId: createdJournal.id,
          volumeNumber: 1,
          year: currentYear,
          title: `Volume 1 (${currentYear}): Inaugural Scholarly Research`,
          description: `Inaugural volume of ${title} presenting high-impact scholarly contributions.`,
        },
      });

      // 3. Initialize Issue 1 (PUBLISHED)
      await tx.issue.create({
        data: {
          journalId: createdJournal.id,
          volumeId: volume1.id,
          issueNumber: 1,
          year: currentYear,
          title: `Inaugural Issue: Advances in ${abbreviation || title}`,
          description: `Premier issue featuring foundational peer-reviewed research and methodologies.`,
          status: 'PUBLISHED',
          isCurrent: true,
          publicationDate: new Date(),
          editorialIntroduction: `Welcome to the inaugural issue of ${title}. All articles undergo rigorous double-anonymous peer review to ensure exceptional scientific merit and reproducible impact.`,
          coverImageUrl: coverImageUrl || null,
        },
      });

      // 4. Assign Admin as Editor-in-Chief in Editorial Board
      if (adminUser?.id) {
        await tx.editorialBoardMember.create({
          data: {
            journalId: createdJournal.id,
            userId: adminUser.id,
            roleTitle: 'Editor-in-Chief',
            affiliation: adminUser.affiliation || 'NextGen Press Governance Board',
            displayOrder: 1,
          },
        });
      }

      return createdJournal;
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'CREATE_JOURNAL',
      entityType: 'JOURNAL',
      entityId: journal.id,
      details: { title, slug: cleanSlug },
    });

    return NextResponse.json({ success: true, journal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
