import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin } from '@/lib/permissions';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/dashboard/admin')}`);
  }

  const user = session.user as any;

  if (!isMasterAdmin(user)) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Master Administrator Authority Required</h2>
        <p className="text-sm text-slate-600">
          Your account ({user.email}) does not hold the MASTER_ADMIN governance role for NextGen Press.
        </p>
      </div>
    );
  }

  const [
    totalJournals,
    totalUsers,
    totalSubmissions,
    awaitingScreening,
    underReview,
    revisionsAwaiting,
    acceptedAwaitingProduction,
    publishedCount,
    doiRegisteredCount,
    doiFailedCount,
    users,
    journals,
    doiRecords,
    auditEvents,
  ] = await Promise.all([
    prisma.journal.count(),
    prisma.user.count(),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: { in: ['SUBMITTED', 'INITIAL_SCREENING'] } } }),
    prisma.submission.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.submission.count({ where: { status: 'REVISIONS_REQUESTED' } }),
    prisma.submission.count({ where: { status: { in: ['ACCEPTED', 'COPYEDITING', 'PRODUCTION'] } } }),
    prisma.publishedArticle.count(),
    prisma.dOIRecord.count({ where: { status: 'REGISTERED' } }),
    prisma.dOIRecord.count({ where: { status: 'FAILED' } }),
    prisma.user.findMany({
      include: {
        roleAssignments: {
          include: { journal: { select: { slug: true, title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.journal.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.dOIRecord.findMany({
      include: {
        submission: { select: { submissionNumber: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditEvent.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const metrics = {
    totalJournals,
    totalUsers,
    totalSubmissions,
    awaitingScreening,
    underReview,
    revisionsAwaiting,
    acceptedAwaitingProduction,
    publishedCount,
    doiRegisteredCount,
    doiFailedCount,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
            Master Governance
          </span>
          <span className="text-xs text-slate-500">Security Clearance Level 1</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
          Publisher Master Administration
        </h1>
        <p className="text-xs text-slate-500">
          Executive control across all journals, user roles, Crossref DOI registries, and platform audit trails.
        </p>
      </div>

      <AdminDashboardClient
        metrics={metrics}
        users={users}
        journals={journals}
        doiRecords={doiRecords}
        auditEvents={auditEvents}
        currentUser={user}
      />
    </div>
  );
}
