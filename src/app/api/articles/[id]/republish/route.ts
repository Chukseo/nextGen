import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateAPACitation } from '@/lib/citations';
import { formatDOISuffix } from '@/lib/crossref';

export const dynamic = 'force-dynamic';

/**
 * POST /api/articles/[id]/republish
 * Re-publishes an article that was previously unpublished.
 * Accessible by: Master Admin, or an Editor scoped to the journal.
 */
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
    const targetId = params.id;

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    // Find the submission (or published article)
    const submission = await prisma.submission.findFirst({
      where: {
        OR: [
          { id: targetId },
          { publishedArticle: { id: targetId } },
        ],
      },
      include: {
        journal: true,
        publishedArticle: {
          include: { issue: { include: { volume: true } } },
        },
        coAuthors: { orderBy: { authorOrder: 'asc' } },
        files: { orderBy: { createdAt: 'desc' } },
        doiRecord: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Article or submission record not found.' },
        { status: 404 }
      );
    }

    if (!isMasterAdmin(user) && !isEditor(user, submission.journalId || '')) {
      return NextResponse.json(
        { error: 'Unauthorized to republish articles for this journal' },
        { status: 403 }
      );
    }

    const now = new Date();

    // Case 1: PublishedArticle record already exists
    if (submission.publishedArticle) {
      await prisma.$transaction([
        prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
          },
        }),
        prisma.publishedArticle.update({
          where: { id: submission.publishedArticle.id },
          data: {
            publishedAt: now,
          },
        }),
      ]);
    } else {
      // Case 2: PublishedArticle record was deleted during unpublish
      // Find the issue to assign to: either body.issueId, or the latest issue in the journal
      let targetIssueId = body.issueId;
      if (!targetIssueId) {
        const latestIssue = await prisma.issue.findFirst({
          where: { journalId: submission.journalId },
          orderBy: [{ year: 'desc' }, { issueNumber: 'desc' }],
        });
        if (!latestIssue) {
          return NextResponse.json(
            { error: 'No issue exists for this journal. Please create an issue before re-publishing.' },
            { status: 400 }
          );
        }
        targetIssueId = latestIssue.id;
      }

      const issue = await prisma.issue.findUnique({
        where: { id: targetIssueId },
        include: { journal: true, volume: true },
      });

      if (!issue) {
        return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
      }

      const prefix = process.env.CROSSREF_DOI_PREFIX || '10.5555';
      let seqNum = parseInt(submission.submissionNumber.split('-').pop() || '1', 10);
      if (isNaN(seqNum) || seqNum <= 0) seqNum = 1;

      let finalSuffix = submission.doiRecord?.suffix || formatDOISuffix(issue.journal.slug, issue.year, seqNum);
      let finalDoi = submission.doiRecord?.doi || `${prefix}/${finalSuffix}`;

      // Ensure collision-free unique candidate DOI
      let candidateDoi = finalDoi;
      let existingRecord = await prisma.dOIRecord.findUnique({
        where: { doi: candidateDoi },
      });
      while (existingRecord && existingRecord.submissionId !== submission.id) {
        seqNum += 1;
        finalSuffix = formatDOISuffix(issue.journal.slug, issue.year, seqNum);
        candidateDoi = `${prefix}/${finalSuffix}`;
        existingRecord = await prisma.dOIRecord.findUnique({
          where: { doi: candidateDoi },
        });
      }
      finalDoi = candidateDoi;

      const citationString = generateAPACitation({
        authors: submission.coAuthors.map((a) => ({ firstName: a.firstName, lastName: a.lastName })),
        year: issue.year,
        title: submission.title,
        journalTitle: issue.journal.title,
        volumeNumber: issue.volume.volumeNumber,
        issueNumber: issue.issueNumber,
        doi: finalDoi,
      });

      const primaryFile = submission.files[0];
      const resolvedPdfStorageKey = primaryFile?.storageKey || `published/${submission.submissionNumber}.pdf`;
      const resolvedPdfUrl = primaryFile?.storageUrl || `/storage/published/${submission.submissionNumber}.pdf`;

      await prisma.$transaction(async (tx) => {
        await tx.publishedArticle.create({
          data: {
            submissionId: submission.id,
            issueId: issue.id,
            journalId: issue.journalId,
            title: submission.title,
            abstract: submission.abstract,
            doi: finalDoi,
            doiStatus: submission.doiRecord?.status || 'DRAFT',
            articleNumber: String(seqNum).padStart(3, '0'),
            pdfStorageKey: resolvedPdfStorageKey,
            pdfUrl: resolvedPdfUrl,
            license: 'CC BY 4.0',
            citationString,
            publishedAt: now,
          },
        });

        await tx.submission.update({
          where: { id: submission.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
          },
        });

        await tx.dOIRecord.upsert({
          where: { submissionId: submission.id },
          update: {
            doi: finalDoi,
            prefix,
            suffix: finalSuffix,
          },
          create: {
            submissionId: submission.id,
            doi: finalDoi,
            prefix,
            suffix: finalSuffix,
            status: 'DRAFT',
          },
        });
      });
    }

    // Notify author
    if (submission.authorId) {
      await createNotification({
        userId: submission.authorId,
        type: 'STATUS_CHANGE',
        title: `Article Re-Published: ${submission.title}`,
        message: `Your article "${submission.title}" has been re-published and is now live.`,
        linkUrl: `/dashboard/author`,
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: 'REPUBLISH_ARTICLE',
      entityType: 'SUBMISSION',
      entityId: submission.id,
      details: {
        title: submission.title,
        journalId: submission.journalId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Article successfully re-published and is now live.',
    });
  } catch (error: any) {
    console.error('Republish article error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
