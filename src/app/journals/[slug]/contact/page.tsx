import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getBaseUrl } from '@/lib/siteUrl';
import JournalContactClient from './JournalContactClient';

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
    return { title: 'Contact Editorial Office | NextGen Innovation & Research Journals' };
  }

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/journals/${journal.slug}/contact`;

  return {
    title: `Contact Editorial Office | ${journal.title}`,
    description: `Contact the Editor-in-Chief, editorial office, and production team for ${journal.title}.`,
    alternates: { canonical },
  };
}

export default async function JournalContactPage({
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

  return <JournalContactClient journal={journal} />;
}
