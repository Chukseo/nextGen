import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import EditorDashboardClient from './EditorDashboardClient';

export const revalidate = 0;

export default async function EditorDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/dashboard/editor')}`);
  }

  const user = session.user as any;

  if (!isMasterAdmin(user) && !isEditor(user)) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Editorial Privilege Required</h2>
        <p className="text-sm text-slate-600">
          Your scholarly account ({user.email}) does not have active Editor or Journal Manager assignments.
        </p>
      </div>
    );
  }

  // Fetch submissions and issues permitted for this editor
  let whereSub: any = {};
  let whereIssues: any = {};
  const editorRoles = user.roles?.filter((r: any) => r.role === 'EDITOR' || r.role === 'JOURNAL_MANAGER') || [];
  const journalIds = editorRoles.map((r: any) => r.journalId).filter(Boolean);

  if (!isMasterAdmin(user)) {
    if (journalIds.length > 0) {
      whereSub.journalId = { in: journalIds };
      whereIssues.journalId = { in: journalIds };
    }
  }

  const [submissions, allJournals, reviewers, issues] = await Promise.all([
    prisma.submission.findMany({
      where: whereSub,
      include: {
        journal: true,
        coAuthors: { orderBy: { authorOrder: 'asc' } },
        files: { orderBy: { createdAt: 'desc' } },
        editorialDecisions: {
          include: { editor: { select: { name: true } } },
          orderBy: { decidedAt: 'desc' },
        },
        reviewAssignments: {
          include: {
            reviewer: { select: { id: true, name: true, email: true, affiliation: true } },
            report: true,
          },
        },
        doiRecord: true,
        publishedArticle: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.journal.findMany({
      orderBy: { title: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        roleAssignments: { some: { role: 'REVIEWER' } },
      },
      select: { id: true, name: true, email: true, affiliation: true },
    }),
    prisma.issue.findMany({
      where: whereIssues,
      include: {
        journal: true,
        volume: true,
        publishedArticles: {
          select: { id: true, title: true, articleNumber: true },
        },
      },
      orderBy: [{ year: 'desc' }, { issueNumber: 'desc' }],
    }),
  ]);

  const permittedJournals = isMasterAdmin(user) || journalIds.length === 0
    ? allJournals
    : allJournals.filter((j) => journalIds.includes(j.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Editorial Office</span>
        <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
          Editorial Queue & Decision Center
        </h1>
        <p className="text-xs text-slate-500">
          Managing submissions following NextGen Press scholarly editorial workflow. Logged in as <strong>{user.name || user.email}</strong>.
        </p>
      </div>

      <EditorDashboardClient
        submissions={submissions}
        journals={permittedJournals}
        reviewers={reviewers}
        issues={issues}
        currentUser={user}
      />
    </div>
  );
}
