import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import JournalPrivacyClient from './JournalPrivacyClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalPrivacyPage({
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

  return <JournalPrivacyClient journal={journal} />;
}
