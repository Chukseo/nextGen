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

  // Fetch submissions permitted for this editor
  let whereSub: any = {};
  if (!isMasterAdmin(user)) {
    const editorRoles = user.roles.filter((r: any) => r.role === 'EDITOR' || r.role === 'JOURNAL_MANAGER');
    const journalIds = editorRoles.map((r: any) => r.journalId).filter(Boolean);
    if (journalIds.length > 0) {
      whereSub.journalId = { in: journalIds };
    }
  }

  const [submissions, journals, reviewers, issues] = await Promise.all([
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
    prisma.journal.findMany(),
    prisma.user.findMany({
      where: {
        roleAssignments: { some: { role: 'REVIEWER' } },
      },
      select: { id: true, name: true, email: true, affiliation: true },
    }),
    prisma.issue.findMany({
      include: { journal: true, volume: true },
      orderBy: [{ year: 'desc' }, { issueNumber: 'desc' }],
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Editorial Office</span>
        <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
          Editorial Queue & Decision Center
        </h1>
        <p className="text-xs text-slate-500">
          Managing submissions following standard PKP OJS editorial workflow. Logged in as <strong>{user.name || user.email}</strong>.
        </p>
      </div>

      <EditorDashboardClient
        submissions={submissions}
        journals={journals}
        reviewers={reviewers}
        issues={issues}
        currentUser={user}
      />
    </div>
  );
}
