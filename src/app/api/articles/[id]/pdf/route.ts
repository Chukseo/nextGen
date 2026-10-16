import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateScholarlyArticlePdf } from '@/lib/pdfGenerator';

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
            editorialDecisions: { orderBy: { decidedAt: 'desc' }, take: 1 },
          },
        },
        keywords: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Published article not found' }, { status: 404 });
    }

    const latestDecision = article.submission.editorialDecisions?.[0];

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
