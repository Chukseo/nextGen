import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { generateAPACitation } from '@/lib/citations';
import { formatDOISuffix } from '@/lib/crossref';
import { generateScholarlyArticlePdf, extractDocxText, parseManuscriptDocx } from '@/lib/pdfGenerator';
import { uploadFile, getFileBuffer } from '@/lib/storage';

export const dynamic = 'force-dynamic';

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
      customPdfStorageKey,
      customPdfUrl,
      pdfStorageKey,
      pdfUrl,
      license = 'CC BY 4.0',
    } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required to publish an article.' },
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
        files: { orderBy: { createdAt: 'desc' } },
        doiRecord: true,
        editorialDecisions: { orderBy: { decidedAt: 'desc' }, take: 1 },
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

    // 1. Calculate collision-free unique DOI
    const prefix = process.env.CROSSREF_DOI_PREFIX || '10.5555';
    let seqNum = parseInt(articleNumber || submission.submissionNumber.split('-').pop() || '1', 10);
    if (isNaN(seqNum) || seqNum <= 0) seqNum = 1;

    let finalSuffix = submission.doiRecord?.suffix || formatDOISuffix(issue.journal.slug, issue.year, seqNum);
    let finalDoi = submission.doiRecord?.doi || `${prefix}/${finalSuffix}`;

    if (!submission.doiRecord) {
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
    }

    const publishedDate = new Date();

    const citationString = generateAPACitation({
      title: submission.title,
      journalTitle: issue.journal.title,
      volumeNumber: issue.volume.volumeNumber,
      issueNumber: issue.issueNumber,
      year: issue.year,
      pages: pageRange,
      doi: finalDoi,
      authors: submission.coAuthors.map((a) => ({ firstName: a.firstName, lastName: a.lastName })),
    });

    // 2. Determine PDF: If editor uploaded a custom typeset PDF, use it. Otherwise, generate typeset PDF from manuscript.
    let resolvedPdfStorageKey = customPdfStorageKey || pdfStorageKey || null;
    let resolvedPdfUrl = customPdfUrl || pdfUrl || null;

    if (!resolvedPdfUrl || resolvedPdfUrl.startsWith('/storage/published/') || resolvedPdfUrl.startsWith('/api/articles/')) {
      try {
        const latestDecision = submission.editorialDecisions?.[0];

        // Extract full text and tables from submitted manuscript file
        let manuscriptFullText: string | null = null;
        let manuscriptBlocks: any = null;
        const manuscriptFile = submission.files?.find(
          (f: any) => f.fileType === 'MANUSCRIPT_DOCX' || f.fileType === 'REVISION' || f.fileType === 'COPYEDITED'
        );

        if (manuscriptFile?.storageKey) {
          try {
            const fileBuffer = await getFileBuffer(manuscriptFile.storageKey, 'manuscripts-private');
            const parsed = await parseManuscriptDocx(fileBuffer);
            manuscriptFullText = parsed.fullText;
            manuscriptBlocks = parsed.blocks;
          } catch (fileErr) {
            console.warn('Could not extract submitted manuscript full text during publishing:', fileErr);
          }
        }

        const declarations = [
          { label: 'Funding Information', text: submission.fundingInfo },
          { label: 'Conflict of Interest', text: submission.conflictOfInterest },
          { label: 'Data Availability', text: submission.dataAvailability },
          { label: 'Ethical Approval & Consent', text: submission.ethicsStatement || submission.consentStatement },
          { label: 'Acknowledgements', text: submission.acknowledgements },
        ];

        const pdfBytes = await generateScholarlyArticlePdf({
          journalTitle: issue.journal.title,
          journalAbbreviation: issue.journal.abbreviation,
          onlineIssn: issue.journal.onlineIssn,
          volumeNumber: issue.volume.volumeNumber,
          issueNumber: issue.issueNumber,
          year: issue.year,
          articleNumber: articleNumber || String(seqNum).padStart(3, '0'),
          pageRange,
          doi: finalDoi,
          articleType: submission.articleType,
          title: submission.title,
          abstract: submission.abstract,
          manuscriptFullText,
          manuscriptBlocks,
          declarations,
          publishedAt: publishedDate,
          receivedAt: submission.createdAt,
          acceptedAt: latestDecision?.decidedAt || publishedDate,
          citationString,
          license,
          authors: submission.coAuthors.map((a) => ({
            firstName: a.firstName,
            lastName: a.lastName,
            affiliation: a.affiliation,
            orcid: a.orcid,
            isCorresponding: a.isCorresponding,
            email: a.email,
          })),
        });

        const fileName = `${issue.journal.abbreviation}_${issue.year}_${articleNumber || String(seqNum).padStart(3, '0')}.pdf`;
        const uploadRes = await uploadFile({
          fileBuffer: Buffer.from(pdfBytes),
          originalFileName: fileName,
          mimeType: 'application/pdf',
          bucketName: 'published-articles',
        });

        resolvedPdfStorageKey = uploadRes.storageKey;
        resolvedPdfUrl = uploadRes.publicUrl || `/api/articles/${submission.id}/pdf`;
      } catch (pdfErr) {
        console.error('Automated PDF generation fallback warning:', pdfErr);
        if (!resolvedPdfStorageKey) {
          resolvedPdfStorageKey = `published/${submission.submissionNumber}.pdf`;
        }
        if (!resolvedPdfUrl) {
          resolvedPdfUrl = `/api/articles/${submission.id}/pdf`;
        }
      }
    }

    // 3. Atomic transaction to publish article & record DOI
    const published = await prisma.$transaction(async (tx) => {
      // 1. Create or update PublishedArticle
      const pubArt = await tx.publishedArticle.upsert({
        where: { submissionId: submission.id },
        update: {
          issueId: issue.id,
          journalId: issue.journalId,
          title: submission.title,
          abstract: submission.abstract,
          doi: finalDoi,
          doiStatus: submission.doiRecord?.status || 'DRAFT',
          articleNumber: articleNumber || String(seqNum).padStart(3, '0'),
          pageRange,
          pdfStorageKey: resolvedPdfStorageKey,
          pdfUrl: resolvedPdfUrl,
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
          doi: finalDoi,
          doiStatus: submission.doiRecord?.status || 'DRAFT',
          articleNumber: articleNumber || String(seqNum).padStart(3, '0'),
          pageRange,
          pdfStorageKey: resolvedPdfStorageKey,
          pdfUrl: resolvedPdfUrl,
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
          originalFileName: `${issue.journal.abbreviation}_${issue.year}_${articleNumber || String(seqNum).padStart(3, '0')}.pdf`,
          storageKey: resolvedPdfStorageKey,
          storageUrl: resolvedPdfUrl,
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

      // 4. Ensure DOI record exists or updates safely (collision-free)
      await tx.dOIRecord.upsert({
        where: { submissionId: submission.id },
        update: {
          doi: finalDoi,
          prefix,
          suffix: finalSuffix,
          status: submission.doiRecord?.status || 'DRAFT',
        },
        create: {
          submissionId: submission.id,
          doi: finalDoi,
          prefix,
          suffix: finalSuffix,
          status: 'DRAFT',
        },
      });

      return pubArt;
    });

    // Notify author
    await createNotification({
      userId: submission.authorId,
      type: 'ARTICLE_PUBLISHED',
      title: `Article Published: ${submission.title}`,
      message: `Your article has been officially published in ${issue.journal.title}, Volume ${issue.volume.volumeNumber}, Issue ${issue.issueNumber}. Assigned DOI: ${finalDoi}.`,
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
        doi: finalDoi,
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
