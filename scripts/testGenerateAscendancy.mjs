import { PrismaClient } from '@prisma/client';
import { generateScholarlyArticlePdf, parseManuscriptDocx } from '../src/lib/pdfGenerator';
import { getFileBuffer, uploadFile } from '../src/lib/storage';

const prisma = new PrismaClient();

async function run() {
  const article = await prisma.publishedArticle.findUnique({
    where: { id: 'cmvc98lqa0015f6he622qj60f' },
    include: {
      journal: true,
      issue: { include: { volume: true } },
      submission: {
        include: {
          coAuthors: { orderBy: { authorOrder: 'asc' } },
          files: { orderBy: { createdAt: 'desc' } },
          editorialDecisions: { orderBy: { decidedAt: 'desc' }, take: 1 },
        },
      },
      references: { orderBy: { orderIndex: 'asc' } },
      keywords: true,
    },
  });

  if (!article) {
    console.error('Article not found');
    return;
  }

  console.log('Article details:');
  console.log('Title:', article.title);
  console.log('Journal:', article.journal?.title);
  console.log('Issue:', article.issue ? `Vol ${article.issue.volume?.volumeNumber} Iss ${article.issue.issueNumber} (${article.issue.year})` : 'NO ISSUE');
  console.log('Authors count:', article.submission?.coAuthors?.length);

  const manuscriptFile = article.submission?.files?.find(
    f => f.fileType === 'MANUSCRIPT_DOCX' || f.fileType === 'REVISION' || f.fileType === 'COPYEDITED'
  );

  console.log('Manuscript file:', manuscriptFile);

  let manuscriptFullText = null;
  let manuscriptBlocks = null;

  if (manuscriptFile?.storageKey) {
    try {
      console.log('Fetching manuscript buffer for key:', manuscriptFile.storageKey);
      const fileBuffer = await getFileBuffer(manuscriptFile.storageKey, 'manuscripts-private');
      console.log('Got buffer, size:', fileBuffer.length);
      const parsed = await parseManuscriptDocx(fileBuffer);
      manuscriptFullText = parsed.fullText;
      manuscriptBlocks = parsed.blocks;
      console.log('Parsed successfully! Blocks:', manuscriptBlocks?.length, 'FullText length:', manuscriptFullText?.length);
    } catch (err) {
      console.error('Error parsing docx:', err);
    }
  }

  const latestDecision = article.submission?.editorialDecisions?.[0];
  const declarations = [
    { label: 'Funding Information', text: article.submission?.fundingInfo },
    { label: 'Conflict of Interest', text: article.submission?.conflictOfInterest },
    { label: 'Data Availability', text: article.submission?.dataAvailability },
    { label: 'Ethical Approval & Consent', text: article.submission?.ethicsStatement || article.submission?.consentStatement },
    { label: 'Acknowledgements', text: article.submission?.acknowledgements },
  ];

  try {
    console.log('Starting generateScholarlyArticlePdf...');
    const pdfBytes = await generateScholarlyArticlePdf({
      journalTitle: article.journal.title,
      journalAbbreviation: article.journal.abbreviation,
      onlineIssn: article.journal.onlineIssn,
      volumeNumber: article.issue?.volume?.volumeNumber || 1,
      issueNumber: article.issue?.issueNumber || 1,
      year: article.issue?.year || new Date().getFullYear(),
      articleNumber: article.articleNumber,
      pageRange: article.pageRange,
      doi: article.doi || '',
      articleType: article.submission?.articleType || 'RESEARCH_ARTICLE',
      title: article.title,
      abstract: article.abstract,
      keywords: article.keywords.map(k => k.keyword),
      manuscriptFullText,
      manuscriptBlocks,
      declarations,
      references: article.references,
      publishedAt: article.publishedAt,
      receivedAt: article.submission?.createdAt || article.publishedAt,
      acceptedAt: latestDecision?.decidedAt || article.publishedAt,
      citationString: article.citationString || undefined,
      license: article.license,
      authors: article.submission?.coAuthors?.map(a => ({
        firstName: a.firstName,
        lastName: a.lastName,
        affiliation: a.affiliation,
        orcid: a.orcid,
        isCorresponding: a.isCorresponding,
        email: a.email,
      })) || [],
    });

    console.log('Generated PDF successfully! PDF bytes:', pdfBytes.length);

    // Now upload and update DB so it has a permanent real PDF!
    const filename = `${Date.now()}_${article.journal.abbreviation.replace(/[^a-zA-Z0-9]/g, '_')}_${article.articleNumber || '001'}.pdf`;
    const storageKey = `published-articles/${filename}`;
    const uploadResult = await uploadFile(Buffer.from(pdfBytes), storageKey, 'published-articles', 'application/pdf');
    console.log('Uploaded to Supabase Storage:', uploadResult);

    await prisma.publishedArticle.update({
      where: { id: article.id },
      data: {
        pdfUrl: uploadResult.publicUrl,
        pdfStorageKey: storageKey,
      }
    });

    console.log('Updated database record with new real PDF URL and storage key!');
  } catch (genErr) {
    console.error('Error during generateScholarlyArticlePdf:', genErr);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
