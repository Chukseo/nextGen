import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getBaseUrl } from '@/lib/siteUrl';
import JournalEditorialBoardClient from './JournalEditorialBoardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
    select: { title: true, slug: true, abbreviation: true },
  });

  if (!journal) {
    return { title: 'Editorial Board | NextGen Innovation & Research Journals' };
  }

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/journals/${journal.slug}/editorial-board`;

  return {
    title: `Editorial Board & Editors | ${journal.title}`,
    description: `Meet the Editor-in-Chief, Associate Editors, and International Editorial Board members of ${journal.title}.`,
    alternates: { canonical },
  };
}

export default async function JournalEditorialBoardPage({
  params,
}: Props) {
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
