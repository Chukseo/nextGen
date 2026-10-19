import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import JournalContactClient from './JournalContactClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalContactPage({
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

  return <JournalContactClient journal={journal} />;
}
