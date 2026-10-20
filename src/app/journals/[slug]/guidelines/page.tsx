import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { generateDefaultAuthorGuidelines } from '@/lib/guidelinesGenerator';
import JournalGuidelinesClient from './JournalGuidelinesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalGuidelinesPage({
  params,
}: {
  params: { slug: string };
}) {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
  });

  if (!journal) {
    notFound();
  }

  // Use the authorGuidelines column on Journal first, fall back to generated default
  const guidelinesText = journal.authorGuidelines || generateDefaultAuthorGuidelines(journal);

  return (
    <JournalGuidelinesClient
      journal={journal}
      guidelinesText={guidelinesText}
    />
  );
}
