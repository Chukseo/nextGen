import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import SubmissionWizard from '@/components/SubmissionWizard';
import { UploadCloud, ShieldCheck } from 'lucide-react';

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: { journal?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/submit')}`);
  }

  const journals = await prisma.journal.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      title: true,
      abbreviation: true,
      aimsScope: true,
      peerReviewPolicy: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Editorial System</span>
        <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
          Manuscript Submission Wizard
        </h1>
        <p className="text-xs text-slate-500">
          Logged in as <strong>{session.user.name || session.user.email}</strong>. Submissions follow standard OJS workflow.
        </p>
      </div>

      <SubmissionWizard
        journals={journals}
        initialJournalId={searchParams.journal}
        userSession={session.user}
      />
    </div>
  );
}
