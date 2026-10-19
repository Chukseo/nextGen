import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Layers, Calendar, ArrowRight, BookOpen, Star, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IssuesPage({
  searchParams,
}: {
  searchParams?: { journal?: string };
}) {
  const selectedJournalSlug = searchParams?.journal || 'ALL';

  const [journals, allIssues] = await Promise.all([
    prisma.journal.findMany({
      where: { isActive: true },
      select: { id: true, title: true, slug: true, abbreviation: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.issue.findMany({
      where: {
        status: 'PUBLISHED',
        ...(selectedJournalSlug !== 'ALL' ? { journal: { slug: selectedJournalSlug } } : {}),
      },
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
      orderBy: [
        { isCurrent: 'desc' },
        { year: 'desc' },
        { issueNumber: 'desc' },
      ],
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="border-b border-slate-200 pb-6 space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Journal Archives & Catalog</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
              Current Issues & Archives
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl mt-1">
              Browse published volumes, current issues, and complete tables of contents across all NextGen Press academic journals.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{allIssues.length}</strong> {allIssues.length === 1 ? 'issue' : 'issues'}
          </div>
        </div>

        {/* Journal Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Link
            href="/issues"
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedJournalSlug === 'ALL'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Journals
          </Link>
          {journals.map((j) => (
            <Link
              key={j.id}
              href={`/issues?journal=${j.slug}`}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedJournalSlug === j.slug
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {j.abbreviation}
            </Link>
          ))}
        </div>
      </div>

      {allIssues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Published Issues Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {selectedJournalSlug !== 'ALL'
              ? 'No published issues are available yet for this journal. Issues in preparation will appear once released.'
              : 'No published issues currently match the filter criteria.'}
          </p>
          <div className="pt-2">
            <Link
              href="/issues"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              &larr; View all journal issues
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {allIssues.map((issue) => (
            <div
              key={issue.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm space-y-6 transition-all ${
                issue.isCurrent ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
              }`}
            >
              {/* Issue Header */}
              <div className="bg-navy-950 text-white p-6 sm:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div className="flex gap-5 items-start flex-1">
                  {(issue.coverImageUrl || issue.journal.coverImageUrl) && (
                    <div className="w-20 sm:w-24 flex-shrink-0 rounded overflow-hidden border border-slate-700 shadow-md bg-navy-900 hidden sm:block">
                      <Link href={`/issues/${issue.id}`}>
                        <img
                          src={(issue.coverImageUrl || issue.journal.coverImageUrl) || undefined}
                          alt={issue.title}
                          className="w-full h-auto aspect-[3/4] object-cover hover:scale-105 transition-transform"
                        />
                      </Link>
                    </div>
                  )}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <Link href={`/journals/${issue.journal.slug}`} className="text-blue-400 hover:underline uppercase">
                        {issue.journal.title}
                      </Link>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">Vol. {issue.volume.volumeNumber}, No. {issue.issueNumber} ({issue.year})</span>
                      {issue.isCurrent && (
                        <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded shadow-sm inline-flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>CURRENT ISSUE</span>
                        </span>
                      )}
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
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/journals/${issue.journal.slug}`}
                      className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition-colors font-medium"
                    >
                      Journal Home
                    </Link>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors font-semibold flex items-center space-x-1"
                    >
                      <span>Explore Issue</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Table of Contents */}
              <div className="p-6 sm:p-8 pt-0 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Table of Contents
                </h3>

                {issue.publishedArticles.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    Articles for this volume & issue are in final typeset production.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {issue.publishedArticles.map((article) => {
                      const authors = article.submission.coAuthors
                        .map((a) => `${a.firstName} ${a.lastName}`)
                        .join(', ');

                      return (
                        <div key={article.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="space-y-1.5 flex-1">
                            <h4 className="text-base font-bold text-slate-900 scholarly-heading hover:text-blue-700">
                              <Link href={`/articles/${article.slug || article.id}`}>{article.title}</Link>
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
                              href={`/articles/${article.slug || article.id}`}
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded font-semibold transition-colors"
                            >
                              View Article
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
