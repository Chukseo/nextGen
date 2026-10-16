import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Layers, Calendar, ArrowRight, BookOpen, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      journal: true,
      volume: true,
      publishedArticles: {
        include: {
          submission: {
            include: { coAuthors: { orderBy: { authorOrder: 'asc' } } },
          },
        },
      },
    },
    orderBy: [{ year: 'desc' }, { issueNumber: 'desc' }],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Journal Archives</span>
        <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
          Current Issues & Archive
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Browse published volumes, special issues, and complete tables of contents across all NextGen Press academic journals.
        </p>
      </div>

      <div className="space-y-10">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-6"
          >
            {/* Issue Header */}
            <div className="bg-navy-950 text-white p-6 sm:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div className="flex gap-5 items-start flex-1">
                {issue.coverImageUrl && (
                  <div className="w-20 sm:w-24 flex-shrink-0 rounded overflow-hidden border border-slate-700 shadow-md bg-navy-900 hidden sm:block">
                    <Link href={`/issues/${issue.id}`}>
                      <img
                        src={issue.coverImageUrl}
                        alt={issue.title}
                        className="w-full h-auto aspect-[3/4] object-cover hover:scale-105 transition-transform"
                      />
                    </Link>
                  </div>
                )}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2 text-xs text-blue-400 font-semibold uppercase">
                    <Link href={`/journals/${issue.journal.slug}`} className="hover:underline">
                      {issue.journal.title}
                    </Link>
                    <span>•</span>
                    <span>Vol. {issue.volume.volumeNumber}, No. {issue.issueNumber} ({issue.year})</span>
                  </div>
                  <h2 className="text-2xl font-bold scholarly-heading">
                    <Link href={`/issues/${issue.id}`} className="hover:text-blue-300">
                      {issue.title}
                    </Link>
                  </h2>
                  {issue.editorialIntroduction && (
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed italic">
                      &ldquo;{issue.editorialIntroduction}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-400 flex flex-col md:items-end flex-shrink-0">
                <span>Published: {issue.publicationDate ? new Date(issue.publicationDate).toLocaleDateString() : 'Recent'}</span>
                <span className="text-emerald-400 font-semibold">{issue.publishedArticles.length} Published Articles</span>
                <Link
                  href={`/issues/${issue.id}`}
                  className="mt-2 text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <span>Explore Issue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="p-6 sm:p-8 pt-0 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                Table of Contents
              </h3>

              <div className="divide-y divide-slate-100">
                {issue.publishedArticles.map((article) => {
                  const authors = article.submission.coAuthors
                    .map((a) => `${a.firstName} ${a.lastName}`)
                    .join(', ');

                  return (
                    <div key={article.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <h4 className="text-base font-bold text-slate-900 scholarly-heading hover:text-blue-700">
                          <Link href={`/articles/${article.id}`}>{article.title}</Link>
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">{authors}</p>
                        {article.doi && (
                          <div className="text-[11px] font-mono text-slate-500">
                            DOI: {article.doi}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs flex-shrink-0">
                        {article.pageRange && (
                          <span className="text-slate-500">pp. {article.pageRange}</span>
                        )}
                        <Link
                          href={`/articles/${article.id}`}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded font-semibold transition-colors"
                        >
                          View Article
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
