import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getBaseUrl } from '@/lib/siteUrl';
import JournalPrivacyClient from './JournalPrivacyClient';

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
    return { title: 'Privacy Statement | NextGen Innovation & Research Journals' };
  }

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/journals/${journal.slug}/privacy`;

  return {
    title: `Privacy Statement | ${journal.title}`,
    description: `Author and reviewer privacy, data protection, and GDPR compliance policies for ${journal.title}.`,
    alternates: { canonical },
  };
}

export default async function JournalPrivacyPage({
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

  return <JournalPrivacyClient journal={journal} />;
}
