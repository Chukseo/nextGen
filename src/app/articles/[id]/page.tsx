import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getFileBuffer } from '@/lib/storage';
import { parseManuscriptDocx } from '@/lib/pdfGenerator';
import ArticleDetailClient from './ArticleDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArticle(id: string) {
  return await prisma.publishedArticle.findFirst({
    where: {
      OR: [
        { id },
        { submissionId: id },
      ],
      submission: { status: 'PUBLISHED' },
    },
    include: {
      journal: true,
      issue: { include: { volume: true } },
      submission: {
        include: {
          coAuthors: { orderBy: { authorOrder: 'asc' } },
          files: true,
        },
      },
      references: { orderBy: { orderIndex: 'asc' } },
      keywords: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const article = await getArticle(params.id);
  if (!article) {
    return {
      title: 'Article Not Found | NextGen Press',
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://nextgen-press.org';
  const pubDateFormatted = article.publishedAt.toISOString().split('T')[0].replace(/-/g, '/');
  const authorNames = article.submission.coAuthors.map(
    (a) => `${a.firstName} ${a.lastName}`
  );
  const authorAffiliations = article.submission.coAuthors.map((a) => a.affiliation);
  const pageRangeParts = (article.pageRange || '').split('-');
  const firstPage = pageRangeParts[0]?.trim();
  const lastPage = pageRangeParts[1]?.trim();

  return {
    title: `${article.title} | ${article.journal.title}`,
    description: article.abstract,
    keywords: article.keywords.map((k) => k.keyword),
    authors: article.submission.coAuthors.map((a) => ({
      name: `${a.firstName} ${a.lastName}`,
    })),
    openGraph: {
      title: article.title,
      description: article.abstract,
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
      authors: authorNames,
      url: `${baseUrl}/articles/${article.id}`,
      siteName: article.journal.title,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.abstract,
    },
    // Comprehensive Google Scholar, Highwire Press & Dublin Core Indexing Meta Tags
    other: {
      citation_title: article.title,
      citation_author: authorNames,
      citation_author_institution: authorAffiliations,
      citation_publication_date: pubDateFormatted,
      citation_journal_title: article.journal.title,
      citation_journal_abbrev: article.journal.abbreviation,
      ...(article.journal.onlineIssn ? { citation_issn: article.journal.onlineIssn } : {}),
      ...(article.issue?.volume?.volumeNumber ? { citation_volume: String(article.issue.volume.volumeNumber) } : {}),
      ...(article.issue?.issueNumber ? { citation_issue: String(article.issue.issueNumber) } : {}),
      ...(firstPage ? { citation_firstpage: firstPage } : {}),
      ...(lastPage ? { citation_lastpage: lastPage } : {}),
      ...(article.doi ? { citation_doi: article.doi } : {}),
      citation_pdf_url: `${baseUrl}/api/articles/${article.id}/pdf`,
      citation_abstract_html_url: `${baseUrl}/articles/${article.id}`,
      citation_keywords: article.keywords.map((k) => k.keyword).join('; '),
      citation_language: 'en',
      'DC.title': article.title,
      'DC.creator': authorNames,
      'DC.date': article.publishedAt.toISOString().split('T')[0],
      'DC.publisher': article.journal.publisher || 'NextGen Innovation & Research Journals',
      'DC.format': 'text/html',
      'DC.language': 'en',
      ...(article.doi ? { 'DC.identifier': `doi:${article.doi}` } : {}),
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const article = await getArticle(params.id);

  if (!article) {
    notFound();
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
