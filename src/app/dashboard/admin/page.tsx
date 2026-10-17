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

  let metrics = {
    totalJournals: 0,
    totalUsers: 0,
    totalSubmissions: 0,
    awaitingScreening: 0,
    underReview: 0,
    revisionsAwaiting: 0,
    acceptedAwaitingProduction: 0,
    publishedCount: 0,
    doiRegisteredCount: 0,
    doiFailedCount: 0,
  };
  let users: any[] = [];
  let journals: any[] = [];
  let doiRecords: any[] = [];
  let auditEvents: any[] = [];
  let publishedArticles: any[] = [];
  let productionSubmissions: any[] = [];
  let issues: any[] = [];
  let loadError: string | null = null;

  try {
    // Run counts in small batches to respect database pooler limits
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
    ]);

    metrics = {
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

    // Run record fetches in a separate batch
    [users, journals, doiRecords, auditEvents, publishedArticles, productionSubmissions, issues] = await Promise.all([
      prisma.user.findMany({
        include: {
          roleAssignments: {
            include: { journal: { select: { slug: true, title: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.journal.findMany({
        include: {
          volumes: {
            include: {
              issues: {
                orderBy: { issueNumber: 'asc' },
              },
            },
            orderBy: { volumeNumber: 'asc' },
          },
        },
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
      prisma.publishedArticle.findMany({
        orderBy: { publishedAt: 'desc' },
        include: {
          journal: { select: { title: true, abbreviation: true, slug: true } },
          issue: { include: { volume: true } },
          submission: {
            include: { coAuthors: { orderBy: { authorOrder: 'asc' } } },
          },
        },
      }),
      prisma.submission.findMany({
        where: { status: { in: ['PRODUCTION', 'ACCEPTED', 'COPYEDITING'] } },
        orderBy: { updatedAt: 'desc' },
        include: {
          journal: { select: { title: true, abbreviation: true, slug: true } },
          coAuthors: { orderBy: { authorOrder: 'asc' } },
        },
      }),
      prisma.issue.findMany({
        include: {
          journal: { select: { id: true, title: true, abbreviation: true, slug: true } },
          volume: true,
          _count: { select: { publishedArticles: true } },
        },
        orderBy: [
          { isCurrent: 'desc' },
          { year: 'desc' },
          { issueNumber: 'desc' },
        ],
      }),
    ]);
  } catch (error: any) {
    console.error('AdminDashboard database query warning:', error);
    loadError = 'Some real-time metrics could not be loaded due to a transient database sync. Data will refresh shortly.';
  }

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

      {loadError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          {loadError}
        </div>
      )}

      <AdminDashboardClient
        metrics={metrics}
        users={users}
        journals={journals}
        issues={issues}
        doiRecords={doiRecords}
        auditEvents={auditEvents}
        publishedArticles={publishedArticles}
        productionSubmissions={productionSubmissions}
        currentUser={user}
      />
    </div>
  );
}
