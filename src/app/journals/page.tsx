import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { BookOpen, ArrowRight, ShieldCheck, FileText, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalsPage() {
  const journals = await prisma.journal.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          publishedArticles: true,
          issues: true,
          submissions: true,
        },
      },
      editorialBoard: {
        include: { user: { select: { name: true, affiliation: true } } },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Publishing Catalog</span>
        <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
          Academic Journals
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          NextGen Research and Innovation Press oversees peer-reviewed scholarly journals operating across foundational, experimental, and applied domains.
        </p>
      </div>

      <div className="space-y-8">
        {journals.map((journal) => {
          const editorInChief = journal.editorialBoard.find((m) => m.roleTitle.includes('Editor-in-Chief'));

          return (
            <div
              key={journal.id}
              className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <div className="md:col-span-3 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-navy-900 text-white font-bold text-xs px-2.5 py-1 rounded">
                    {journal.slug.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {journal.abbreviation}
                  </span>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Open Access
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 scholarly-heading hover:text-blue-700">
                  <Link href={`/journals/${journal.slug}`}>{journal.title}</Link>
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {journal.description}
                </p>

                {editorInChief && (
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Editor-in-Chief:</span> {editorInChief.user.name} ({editorInChief.affiliation})
                  </div>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div><span className="font-bold text-slate-700">Print ISSN:</span> {journal.printIssn || 'N/A'}</div>
                  <div><span className="font-bold text-slate-700">Online ISSN:</span> {journal.onlineIssn || 'N/A'}</div>
                  <div><span className="font-bold text-slate-700">Review Model:</span> {journal.peerReviewPolicy}</div>
                </div>
              </div>

              {/* Sidebar stats & CTA */}
              <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="block text-lg font-bold text-navy-900">{journal._count.publishedArticles}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">Articles</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="block text-lg font-bold text-navy-900">{journal._count.issues}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">Issues</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    href={`/journals/${journal.slug}`}
                    className="w-full bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs py-2 px-3 rounded text-center block transition-colors"
                  >
                    View Journal
                  </Link>
                  <Link
                    href={`/submit?journal=${journal.id}`}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs py-2 px-3 rounded text-center block transition-colors"
                  >
                    Submit Manuscript
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
