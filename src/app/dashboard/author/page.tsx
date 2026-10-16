import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AuthorDashboardClient from './AuthorDashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AuthorDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/dashboard/author')}`);
  }

  const user = session.user as any;

  let submissions: any[] = [];
  try {
    submissions = await prisma.submission.findMany({
      where: { authorId: user.id },
      include: {
        journal: true,
        coAuthors: { orderBy: { authorOrder: 'asc' } },
        files: { orderBy: { createdAt: 'desc' } },
        editorialDecisions: { orderBy: { decidedAt: 'desc' }, take: 1 },
        doiRecord: true,
        publishedArticle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('AuthorDashboard database query warning:', error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Scholar Portal</span>
        <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
          Author Dashboard
        </h1>
        <p className="text-xs text-slate-500">
          Welcome, {session.user.name || session.user.email}. Manage your academic submissions, reviews, and revisions.
        </p>
      </div>

      <AuthorDashboardClient submissions={submissions} />
    </div>
  );
}
