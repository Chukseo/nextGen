import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getFileBuffer } from '@/lib/storage';
import { parseManuscriptDocx } from '@/lib/pdfGenerator';
import { getBaseUrl } from '@/lib/siteUrl';
import ArticleDetailClient from './ArticleDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: { id: string };
};

async function getArticle(slugOrId: string) {
  return await prisma.publishedArticle.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId },
        { submissionId: slugOrId },
      ],
      submission: { status: 'PUBLISHED' },
    },
    include: {
      journal: true,
      issue: {
        include: {
          volume: true,
        },
      },
      submission: {
        include: {
          author: true,
          coAuthors: {
            orderBy: { authorOrder: 'asc' },
          },
          files: true,
        },
      },
      references: {
        orderBy: { orderIndex: 'asc' },
      },
      keywords: true,
    },
  });
}

function getArticleAuthors(article: any): { names: string[]; affiliations: string[]; raw: any[] } {
  const coAuthors = article.submission?.coAuthors || [];
  if (coAuthors.length > 0) {
    const names = coAuthors.map((c: any) => `${c.firstName} ${c.lastName}`.trim()).filter(Boolean);
    const affiliations = coAuthors.map((c: any) => c.affiliation).filter(Boolean);
    return { names, affiliations, raw: coAuthors };
  }

  const leadName = article.submission?.author?.name;
  if (leadName && !/NextGen|Admin|Staff|System/i.test(leadName)) {
    const affiliation = article.submission?.author?.affiliation || '';
    return {
      names: [leadName.trim()],
      affiliations: affiliation ? [affiliation] : [],
      raw: [{ firstName: leadName, lastName: '', affiliation }],
    };
  }

  return {
    names: ['Scholarly Contributor'],
    affiliations: [],
    raw: [{ firstName: 'Scholarly', lastName: 'Contributor', affiliation: '' }],
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const article = await getArticle(params.id);
  if (!article) {
    return {
      title: 'Article Not Found | NextGen Innovation & Research Journals',
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseUrl();
  const { names: fallbackAuthors, affiliations: authorAffiliations } = getArticleAuthors(article);

  const canonical = `${baseUrl}/articles/${article.slug || article.id}`;
  const citationDate = article.publishedAt
    .toISOString()
    .slice(0, 10)
    .replaceAll('-', '/');

  // Direct public PDF URL or API download stream
  const pdfUrl = `${canonical}/pdf`;

  const publisherName = article.journal.publisher || 'NextGen Innovation & Research Journals, London, UK';

  const citationMetadata: Record<string, string | string[]> = {
    citation_title: article.title,
    citation_author: fallbackAuthors,
    citation_publication_date: citationDate,
    citation_journal_title: article.journal.title,
    citation_publisher: publisherName,
  };

  if (article.journal.abbreviation) {
    citationMetadata.citation_journal_abbrev = article.journal.abbreviation;
  }
  if (article.journal.onlineIssn) {
    citationMetadata.citation_issn = article.journal.onlineIssn;
  }
  if (article.issue?.volume?.volumeNumber) {
    citationMetadata.citation_volume = String(article.issue.volume.volumeNumber);
  }
  if (article.issue?.issueNumber) {
    citationMetadata.citation_issue = String(article.issue.issueNumber);
  }
  if (authorAffiliations.length > 0) {
    citationMetadata.citation_author_institution = authorAffiliations;
  }

  if (article.pageRange) {
    const [firstPage, lastPage] = article.pageRange.split('-', 2);
    if (firstPage) {
      citationMetadata.citation_firstpage = firstPage.trim();
    }
    if (lastPage) {
      citationMetadata.citation_lastpage = lastPage.trim();
    }
  }

  // Active DOI Resolution: Prioritize official Zenodo DOI, or registered non-placeholder Crossref DOI
  const activeDoi = article.zenodoDoi || (article.doi && !article.doi.startsWith('10.5555') && article.doiStatus === 'REGISTERED' ? article.doi : null);
  const zenodoRecordUrl = article.zenodoUrl || (article.zenodoRecordId ? `https://zenodo.org/records/${article.zenodoRecordId}` : undefined);

  if (activeDoi) {
    citationMetadata.citation_doi = activeDoi;
  }

  if (pdfUrl) {
    citationMetadata.citation_pdf_url = pdfUrl;
  }

  citationMetadata.citation_abstract_html_url = canonical;

  if (article.keywords.length > 0) {
    citationMetadata.citation_keywords = article.keywords.map((k) => k.keyword).join('; ');
  }
  citationMetadata.citation_language = 'en';

  // Dublin Core
  citationMetadata['DC.title'] = article.title;
  citationMetadata['DC.creator'] = fallbackAuthors;
  citationMetadata['DC.date'] = article.publishedAt.toISOString().slice(0, 10);
  citationMetadata['DC.publisher'] = publisherName;
  citationMetadata['DC.format'] = 'text/html';
  citationMetadata['DC.language'] = 'en';
  if (activeDoi) {
    citationMetadata['DC.identifier'] = `doi:${activeDoi}`;
  }

  return {
    title: `${article.title} | ${article.journal.title}`,
    description: article.abstract?.slice(0, 300) || '',
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    keywords: article.keywords.map((item) => item.keyword),
    authors: fallbackAuthors.map((name) => ({ name })),
    openGraph: {
      title: article.title,
      description: article.abstract?.slice(0, 300) || '',
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
      authors: fallbackAuthors,
      url: canonical,
      siteName: article.journal.title,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.abstract?.slice(0, 300) || '',
    },
    other: citationMetadata,
  };
}

export default async function ArticleDetailPage({
  params,
}: PageProps) {
  const article = await getArticle(params.id);

  if (!article) {
    notFound();
  }

  // Canonical redirect: If accessed via raw ID or submissionId, redirect to permanent slug URL
  if (article.slug && params.id !== article.slug) {
    redirect(`/articles/${article.slug}`);
  }

  // Increment views count asynchronously
  prisma.publishedArticle.update({
    where: { id: article.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  // Extract manuscript blocks (headings, paragraphs, tables) from manuscript file if present
  let manuscriptBlocks: any = null;
  const manuscriptFile = article.submission.files?.find(
    (f: any) =>
      f.fileType === 'MANUSCRIPT_DOCX' ||
      f.fileType === 'REVISION' ||
      f.fileType === 'COPYEDITED'
  );

  if (manuscriptFile?.storageKey) {
    try {
      const fileBuffer = await getFileBuffer(manuscriptFile.storageKey, 'manuscripts-private');
      if (fileBuffer) {
        const parsed = await parseManuscriptDocx(fileBuffer);
        manuscriptBlocks = parsed.blocks;
      }
    } catch (err) {
      console.warn('Could not extract manuscript blocks for article detail web view:', err);
    }
  }

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/articles/${article.slug || article.id}`;
  const pdfUrl = article.pdfUrl && /^https?:\/\//i.test(article.pdfUrl)
    ? article.pdfUrl
    : `${baseUrl}/api/articles/${article.id}/pdf`;

  const { raw: authorObjects } = getArticleAuthors(article);
  const [firstPage, lastPage] = (article.pageRange || '').split('-', 2);

  const activeDoi = article.zenodoDoi || (article.doi && !article.doi.startsWith('10.5555') && article.doiStatus === 'REGISTERED' ? article.doi : null);
  const zenodoRecordUrl = article.zenodoUrl || (article.zenodoRecordId ? `https://zenodo.org/records/${article.zenodoRecordId}` : undefined);

  const scholarlyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: article.title,
    name: article.title,
    description: article.abstract || undefined,
    url: canonical,
    datePublished: article.publishedAt.toISOString(),
    inLanguage: 'en',
    isPartOf: {
      '@type': 'PublicationIssue',
      issueNumber: article.issue?.issueNumber ? String(article.issue.issueNumber) : undefined,
      isPartOf: {
        '@type': 'PublicationVolume',
        volumeNumber: article.issue?.volume?.volumeNumber ? String(article.issue.volume.volumeNumber) : undefined,
        isPartOf: {
          '@type': 'Periodical',
          name: article.journal.title,
          issn: article.journal.onlineIssn || undefined,
          publisher: {
            '@type': 'Organization',
            name: article.journal.publisher || 'NextGen Innovation & Research Journals',
            url: baseUrl,
          },
        },
      },
    },
    author: authorObjects.map((a: any) => ({
      '@type': 'Person',
      name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Scholarly Author',
      ...(a.affiliation && {
        affiliation: {
          '@type': 'Organization',
          name: a.affiliation,
        },
      }),
    })),
    publisher: {
      '@type': 'Organization',
      name: article.journal.publisher || 'NextGen Innovation & Research Journals',
      url: baseUrl,
    },
    ...(firstPage && { pageStart: firstPage.trim() }),
    ...(lastPage && { pageEnd: lastPage.trim() }),
    ...(article.pageRange && { pagination: article.pageRange }),
    ...(activeDoi && { identifier: activeDoi }),
    ...(zenodoRecordUrl && { sameAs: zenodoRecordUrl }),
    mainEntityOfPage: canonical,
    encoding: {
      '@type': 'MediaObject',
      encodingFormat: 'application/pdf',
      contentUrl: pdfUrl,
    },
    keywords: article.keywords.map((k) => k.keyword),
    license: 'https://creativecommons.org/licenses/by/4.0/',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarlyJsonLd) }}
      />
      <ArticleDetailClient article={article} manuscriptBlocks={manuscriptBlocks} />
    </>
  );
}
