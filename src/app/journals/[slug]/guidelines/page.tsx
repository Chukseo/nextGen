import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { generateDefaultAuthorGuidelines } from '@/lib/guidelinesGenerator';
import { getBaseUrl } from '@/lib/siteUrl';
import JournalGuidelinesClient from './JournalGuidelinesClient';

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
    return { title: 'Author Guidelines | NextGen Innovation & Research Journals' };
  }

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/journals/${journal.slug}/guidelines`;

  return {
    title: `Author Submission Guidelines | ${journal.title}`,
    description: `Manuscript preparation, formatting, citation style, and submission guidelines for ${journal.title}.`,
    alternates: { canonical },
  };
}

export default async function JournalGuidelinesPage({
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

  const eic = journal.editorialBoard?.find(
    (m: any) =>
      m.roleTitle?.toLowerCase().includes('editor-in-chief') ||
      m.roleTitle?.toLowerCase().includes('chief')
  );
  const eicEmail = eic?.user?.email || journal.contactEmail || 'nextgenjournals@gmail.com';

  // Use the authorGuidelines column on Journal first, fall back to generated default
  const guidelinesText =
    journal.authorGuidelines ||
    generateDefaultAuthorGuidelines({
      ...journal,
      contactEmail: eicEmail,
      publisher: journal.publisher || 'NextGen Innovation & Research Journals',
    });

  return (
    <JournalGuidelinesClient
      journal={journal}
      guidelinesText={guidelinesText}
    />
  );
}
