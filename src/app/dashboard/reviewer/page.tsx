import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ReviewerDashboardClient from './ReviewerDashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReviewerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/dashboard/reviewer')}`);
  }

  const user = session.user as any;

  const assignments = await prisma.reviewAssignment.findMany({
    where: { reviewerId: user.id },
    include: {
      submission: {
        include: {
          journal: true,
          files: true,
        },
      },
      report: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Expert Evaluation</span>
        <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
          Peer Reviewer Center
        </h1>
        <p className="text-xs text-slate-500">
          Manuscripts assigned to <strong>{user.name || user.email}</strong> for academic evaluation.
        </p>
      </div>

      <ReviewerDashboardClient assignments={assignments} />
    </div>
  );
}
