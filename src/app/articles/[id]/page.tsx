import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getFileBuffer } from '@/lib/storage';
import { parseManuscriptDocx } from '@/lib/pdfGenerator';
import ArticleDetailClient from './ArticleDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SITE_URL = process.env.NEXTAUTH_URL || 'https://nextgenpress.vercel.app';

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

  // Combine submitting author and co-authors in proper contribution order
  const leadAuthorName = article.submission?.author?.name;
  const coAuthorNames = (article.submission?.coAuthors || []).map(
    (a) => `${a.firstName} ${a.lastName}`.trim()
  );

  const authors = [
    leadAuthorName,
    ...coAuthorNames,
  ]
    .filter((name): name is string => Boolean(name && name.trim()))
    .filter((name, index, all) => all.indexOf(name) === index);

  const fallbackAuthors = authors.length > 0 ? authors : ['Scholar Contributor'];

  const authorAffiliations = (article.submission?.coAuthors || [])
    .map((a) => a.affiliation)
    .filter(Boolean);

  const canonical = `${SITE_URL}/articles/${article.slug || article.id}`;
  const citationDate = article.publishedAt
    .toISOString()
    .slice(0, 10)
    .replaceAll('-', '/');

  // Only use a verified public PDF URL or the public API stream
  const pdfUrl = article.pdfUrl && /^https?:\/\//i.test(article.pdfUrl)
    ? article.pdfUrl
    : `${SITE_URL}/api/articles/${article.id}/pdf`;

  const citationMetadata: Record<string, string | string[]> = {
    citation_title: article.title,
    citation_author: fallbackAuthors,
    citation_publication_date: citationDate,
    citation_journal_title: article.journal.title,
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

  // Only advertise registered DOIs
  if (article.doi && article.doiStatus === 'REGISTERED') {
    citationMetadata.citation_doi = article.doi;
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
  citationMetadata['DC.publisher'] = article.journal.publisher || 'NextGen Innovation & Research Journals';
  citationMetadata['DC.format'] = 'text/html';
  citationMetadata['DC.language'] = 'en';
  if (article.doi && article.doiStatus === 'REGISTERED') {
    citationMetadata['DC.identifier'] = `doi:${article.doi}`;
  }

  return {
    title: `${article.title} | ${article.journal.title}`,
    description: article.abstract?.slice(0, 300) || '',
    alternates: { canonical },
    robots: { index: true, follow: true },
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

  return <ArticleDetailClient article={article} manuscriptBlocks={manuscriptBlocks} />;
}
