import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateScholarlyArticlePdf, extractDocxText, parseManuscriptDocx } from '@/lib/pdfGenerator';
import { getFileBuffer, uploadFile } from '@/lib/storage';

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

    const { searchParams } = new URL(req.url);
    const forceCached = searchParams.get('cached') === 'true';

    // If cached is explicitly requested and remote PDF exists, serve it
    if (forceCached && article.pdfUrl && (article.pdfUrl.startsWith('http://') || article.pdfUrl.startsWith('https://'))) {
      try {
        const response = await fetch(article.pdfUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          prisma.publishedArticle.update({
            where: { id: article.id },
            data: { downloadsCount: { increment: 1 } },
          }).catch(() => {});

          return new Response(new Uint8Array(buffer), {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${article.journal.abbreviation || 'Article'}_${article.articleNumber || 'publication'}.pdf"`,
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      } catch (err) {
        console.warn('Could not stream direct pdfUrl, falling back to generator:', err);
      }
    }

    const latestDecision = article.submission.editorialDecisions?.[0];

    // Extract full text and tables from submitted manuscript file if present
    let manuscriptFullText: string | null = null;
    let manuscriptBlocks: any = null;
    const manuscriptFile = article.submission.files?.find(
      (f: any) => f.fileType === 'MANUSCRIPT_DOCX' || f.fileType === 'REVISION' || f.fileType === 'COPYEDITED'
    );

    if (manuscriptFile?.storageKey) {
      try {
        const fileBuffer = await getFileBuffer(manuscriptFile.storageKey, 'manuscripts-private');
        const parsed = await parseManuscriptDocx(fileBuffer);
        manuscriptFullText = parsed.fullText;
        manuscriptBlocks = parsed.blocks;
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
      journalSlug: article.journal.slug,
      journalUrl: `${process.env.NEXTAUTH_URL || 'https://nextgenjournals.org'}/journals/${article.journal.slug}`,
      onlineIssn: article.journal.onlineIssn,
      printIssn: article.journal.printIssn,
      volumeNumber: article.issue?.volume?.volumeNumber || 1,
      issueNumber: article.issue?.issueNumber || 1,
      year: article.issue?.year || new Date().getFullYear(),
      articleNumber: article.articleNumber,
      pageRange: article.pageRange || article.submission?.pageRange || null,
      doi: article.doi || '',
      articleType: article.submission.articleType,
      title: article.title,
      abstract: article.abstract,
      keywords: article.keywords.map(k => k.keyword),
      manuscriptFullText,
      manuscriptBlocks,
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

    const filename = `${article.journal.abbreviation}_${article.issue?.year || new Date().getFullYear()}_${article.articleNumber || 'article'}.pdf`;

    // Persist newly generated PDF to Supabase storage and update PublishedArticle record for caching
    uploadFile({
      fileBuffer: Buffer.from(pdfBytes),
      originalFileName: `${Date.now()}_${filename}`,
      mimeType: 'application/pdf',
      bucketName: 'published-articles',
    }).then(async (uploaded) => {
      if (uploaded?.publicUrl) {
        await prisma.publishedArticle.update({
          where: { id: article.id },
          data: {
            pdfUrl: uploaded.publicUrl,
            pdfStorageKey: uploaded.storageKey,
          },
        });
      }
    }).catch((uploadErr) => {
      console.warn('Background PDF storage upload failed:', uploadErr);
    });

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
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Article PDF Notice</title><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b192c; color: #f8fafc;">
  <div style="max-width: 480px; padding: 2rem; background: #1e293b; border-radius: 12px; border: 1px solid #334155; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
    <h2 style="margin-top: 0; color: #60a5fa;">Article Typesetter Notice</h2>
    <p style="color: #94a3b8; line-height: 1.6; font-size: 14px;">The official typeset PDF is compiling or updating for this article. Please refresh in a moment to download.</p>
    <a href="javascript:history.back()" style="display: inline-block; margin-top: 1.25rem; padding: 0.6rem 1.25rem; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Return to Article Page</a>
  </div>
</body>
</html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  }
}
