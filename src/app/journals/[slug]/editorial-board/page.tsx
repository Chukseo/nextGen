import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import JournalEditorialBoardClient from './JournalEditorialBoardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalEditorialBoardPage({
  params,
}: {
  params: { slug: string };
}) {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
    include: {
      editorialBoard: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              affiliation: true,
              orcid: true,
              bio: true,
              country: true,
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!journal) {
    notFound();
  }

  return <JournalEditorialBoardClient journal={journal} />;
}
