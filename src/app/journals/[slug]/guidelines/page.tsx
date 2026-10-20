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
