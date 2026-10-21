import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getBaseUrl } from '@/lib/siteUrl';
import JournalSlugClient from './JournalSlugClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      description: true,
      slug: true,
      onlineIssn: true,
      printIssn: true,
      coverImageUrl: true,
      abbreviation: true,
    },
  });

  if (!journal) {
    return {
      title: 'Journal Not Found | NextGen Innovation & Research Journals',
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/journals/${journal.slug}`;
  const desc = journal.description || `Read peer-reviewed research papers and publications from ${journal.title}.`;

  return {
    title: `${journal.title} (${journal.abbreviation || 'Open Access'})`,
    description: desc.slice(0, 300),
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
    openGraph: {
      title: journal.title,
      description: desc.slice(0, 300),
      url: canonical,
      siteName: 'NextGen Innovation & Research Journals',
      type: 'website',
      images: journal.coverImageUrl ? [{ url: journal.coverImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: journal.title,
      description: desc.slice(0, 300),
    },
  };
}

export default async function JournalSlugPage({
  params,
}: Props) {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
    include: {
      editorialBoard: {
        include: { user: true },
        orderBy: { displayOrder: 'asc' },
      },
      volumes: {
        include: {
          issues: {
            where: { status: 'PUBLISHED' },
            include: {
              publishedArticles: {
                include: {
                  submission: {
                    include: { coAuthors: { orderBy: { authorOrder: 'asc' } } },
                  },
                },
                orderBy: { publishedAt: 'desc' },
              },
            },
            orderBy: [{ issueNumber: 'desc' }],
          },
        },
        orderBy: [{ volumeNumber: 'desc' }],
      },
    },
  });

  if (!journal) {
    notFound();
  }

  const publishedIssues = journal.volumes.flatMap((v) =>
    v.issues.map((i) => ({ ...i, volumeNumber: v.volumeNumber }))
  );

  const currentIssue = publishedIssues.find((i) => i.isCurrent) || publishedIssues[0];

  const allPublishedArticles = journal.volumes.flatMap((v) =>
    v.issues.flatMap((i) => i.publishedArticles)
  );

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/journals/${journal.slug}`;

  const periodicalJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Periodical',
    name: journal.title,
    ...(journal.abbreviation && { alternateName: journal.abbreviation }),
    description: journal.description || undefined,
    url: canonical,
    ...(journal.onlineIssn && { issn: journal.onlineIssn }),
    publisher: {
      '@type': 'Organization',
      name: journal.publisher || 'NextGen Innovation & Research Journals',
      url: baseUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(periodicalJsonLd) }}
      />
      <JournalSlugClient
        journal={journal}
        currentIssue={currentIssue}
        allPublishedArticles={allPublishedArticles}
        publishedIssues={publishedIssues}
      />
    </>
  );
}
