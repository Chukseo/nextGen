import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateAPACitation } from '@/lib/citations';
import { formatDOISuffix } from '@/lib/crossref';

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
    const issueId = params.id;
    const body = await req.json();

    const {
      submissionId,
      articleNumber,
      pageRange,
      pdfStorageKey,
      pdfUrl,
      license = 'CC BY 4.0',
    } = body;

    if (!submissionId || !pdfStorageKey) {
      return NextResponse.json(
        { error: 'Submission ID and Final Typeset PDF are required to publish an article.' },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { journal: true, volume: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, issue.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to publish articles in this journal' }, { status: 403 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        coAuthors: { orderBy: { authorOrder: 'asc' } },
        doiRecord: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Must be ACCEPTED or in PRODUCTION stage
    if (submission.status !== 'ACCEPTED' && submission.status !== 'PRODUCTION' && submission.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: `Cannot publish submission with status "${submission.status}". Submission must be ACCEPTED first.` },
        { status: 400 }
      );
    }

    const prefix = process.env.CROSSREF_DOI_PREFIX || '10.5555';
    const sequence = articleNumber || submission.submissionNumber.split('-').pop() || '001';
    const suffix = submission.doiRecord?.suffix || formatDOISuffix(issue.journal.slug, issue.year, sequence);
    const fullDoi = submission.doiRecord?.doi || `${prefix}/${suffix}`;

    const publishedDate = new Date();

    const citationString = generateAPACitation({
      title: submission.title,
      journalTitle: issue.journal.title,
      volumeNumber: issue.volume.volumeNumber,
      issueNumber: issue.issueNumber,
      year: issue.year,
      pages: pageRange,
      doi: fullDoi,
      authors: submission.coAuthors.map((a) => ({ firstName: a.firstName, lastName: a.lastName })),
    });

    // Transaction to publish article
    const published = await prisma.$transaction(async (tx) => {
      // 1. Create or update PublishedArticle
      const pubArt = await tx.publishedArticle.upsert({
        where: { submissionId: submission.id },
        update: {
          issueId: issue.id,
          journalId: issue.journalId,
          title: submission.title,
          abstract: submission.abstract,
          doi: fullDoi,
          doiStatus: submission.doiRecord?.status || 'DRAFT',
          articleNumber,
          pageRange,
          pdfStorageKey,
          pdfUrl: pdfUrl || `/storage/published/${pdfStorageKey.split('/').pop()}`,
          license,
          citationString,
          publishedAt: publishedDate,
        },
        create: {
          submissionId: submission.id,
          issueId: issue.id,
          journalId: issue.journalId,
          title: submission.title,
          abstract: submission.abstract,
          doi: fullDoi,
          doiStatus: submission.doiRecord?.status || 'DRAFT',
          articleNumber,
          pageRange,
          pdfStorageKey,
          pdfUrl: pdfUrl || `/storage/published/${pdfStorageKey.split('/').pop()}`,
          license,
          citationString,
          publishedAt: publishedDate,
        },
      });

      // 2. Add FINAL_TYPESET_PDF file to ManuscriptFile
      await tx.manuscriptFile.create({
        data: {
          submissionId: submission.id,
          versionNumber: 1,
          fileType: 'FINAL_TYPESET_PDF',
          originalFileName: `${issue.journal.abbreviation}_${issue.year}_${articleNumber || 'art'}.pdf`,
          storageKey: pdfStorageKey,
          storageUrl: pdfUrl,
          mimeType: 'application/pdf',
          fileSize: 1024 * 1024,
          isConfidential: false,
          uploadedById: user.id,
        },
      });

      // 3. Update Submission status to PUBLISHED
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: publishedDate,
        },
      });

      // 4. Ensure DOI record exists in DRAFT
      if (!submission.doiRecord) {
        await tx.dOIRecord.create({
          data: {
            submissionId: submission.id,
            doi: fullDoi,
            prefix,
            suffix,
            status: 'DRAFT',
          },
        });
      }

      return pubArt;
    });

    // Notify author
    await createNotification({
      userId: submission.authorId,
      type: 'ARTICLE_PUBLISHED',
      title: `Article Published: ${submission.title}`,
      message: `Your article has been officially published in ${issue.journal.title}, Volume ${issue.volume.volumeNumber}, Issue ${issue.issueNumber}. Assigned DOI: ${fullDoi}.`,
      linkUrl: `/articles/${published.id}`,
    });

    await logAuditEvent({
      userId: user.id,
      action: 'PUBLISH_ARTICLE',
      entityType: 'SUBMISSION',
      entityId: submission.id,
      details: {
        publishedArticleId: published.id,
        issueId: issue.id,
        doi: fullDoi,
      },
    });

    return NextResponse.json({
      success: true,
      publishedArticle: published,
      message: 'Article successfully published.',
    });
  } catch (error: any) {
    console.error('Publish article error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
