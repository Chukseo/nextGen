import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateScholarlyArticlePdf, extractDocxText } from '@/lib/pdfGenerator';
import { getFileBuffer } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;

    const article = await prisma.publishedArticle.findFirst({
      where: {
        OR: [
          { id: articleId },
          { submissionId: articleId },
        ],
        submission: { status: 'PUBLISHED' },
      },
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
      return NextResponse.json({ error: 'Published article not found' }, { status: 404 });
    }

    const latestDecision = article.submission.editorialDecisions?.[0];

    // Extract full text from submitted manuscript file if present
    let manuscriptFullText: string | null = null;
    const manuscriptFile = article.submission.files?.find(
      (f: any) => f.fileType === 'MANUSCRIPT_DOCX' || f.fileType === 'REVISION' || f.fileType === 'COPYEDITED'
    );

    if (manuscriptFile?.storageKey) {
      try {
        const fileBuffer = await getFileBuffer(manuscriptFile.storageKey, 'manuscripts-private');
        manuscriptFullText = await extractDocxText(fileBuffer);
      } catch (fileErr) {
        console.warn('Could not extract submitted manuscript full text:', fileErr);
      }
    }

    const declarations = [
      { label: 'Funding Information', text: article.submission.fundingInfo },
      { label: 'Conflict of Interest', text: article.submission.conflictOfInterest },
      { label: 'Data Availability', text: article.submission.dataAvailability },
      { label: 'Ethical Approval & Consent', text: article.submission.ethicsStatement || article.submission.consentStatement },
      { label: 'Acknowledgements', text: article.submission.acknowledgements },
    ];

    const pdfBytes = await generateScholarlyArticlePdf({
      journalTitle: article.journal.title,
      journalAbbreviation: article.journal.abbreviation,
      onlineIssn: article.journal.onlineIssn,
      volumeNumber: article.issue.volume.volumeNumber,
      issueNumber: article.issue.issueNumber,
      year: article.issue.year,
      articleNumber: article.articleNumber,
      pageRange: article.pageRange,
      doi: article.doi || '',
      articleType: article.submission.articleType,
      title: article.title,
      abstract: article.abstract,
      keywords: article.keywords.map(k => k.keyword),
      manuscriptFullText,
      declarations,
      references: article.references,
      publishedAt: article.publishedAt,
      receivedAt: article.submission.createdAt,
      acceptedAt: latestDecision?.decidedAt || article.publishedAt,
      citationString: article.citationString || undefined,
      license: article.license,
      authors: article.submission.coAuthors.map(a => ({
        firstName: a.firstName,
        lastName: a.lastName,
        affiliation: a.affiliation,
        orcid: a.orcid,
        isCorresponding: a.isCorresponding,
        email: a.email,
      })),
    });

    // Increment downloads count asynchronously
    prisma.publishedArticle.update({
      where: { id: article.id },
      data: { downloadsCount: { increment: 1 } },
    }).catch(() => {});

    const filename = `${article.journal.abbreviation}_${article.issue.year}_${article.articleNumber || 'article'}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('PDF generation endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate article PDF' }, { status: 500 });
  }
}
