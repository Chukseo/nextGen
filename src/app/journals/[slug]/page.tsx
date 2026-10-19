import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import JournalSlugClient from './JournalSlugClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalSlugPage({
  params,
}: {
  params: { slug: string };
}) {
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

  return (
    <JournalSlugClient
      journal={journal}
      currentIssue={currentIssue}
      allPublishedArticles={allPublishedArticles}
      publishedIssues={publishedIssues}
    />
  );
}
