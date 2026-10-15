import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ArticleDetailClient from './ArticleDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const article = await prisma.publishedArticle.findFirst({
    where: {
      OR: [
        { id: params.id },
        { submissionId: params.id },
      ],
      // Confirms only published articles can be retrieved publicly
      submission: { status: 'PUBLISHED' },
    },
    include: {
      journal: true,
      issue: { include: { volume: true } },
      submission: {
        include: {
          coAuthors: { orderBy: { authorOrder: 'asc' } },
          files: true,
        },
      },
      references: { orderBy: { orderIndex: 'asc' } },
      keywords: true,
    },
  });

  if (!article) {
    notFound();
  }

  // Increment views count asynchronously
  prisma.publishedArticle.update({
    where: { id: article.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  return <ArticleDetailClient article={article} />;
}
