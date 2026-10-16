import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Layers, ArrowLeft, Download, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IssueDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
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
  });

  if (!issue) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      <Link
        href="/issues"
        className="text-xs font-semibold text-slate-500 hover:text-blue-700 flex items-center space-x-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to all issues</span>
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-navy-950 text-white p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              {issue.journal.coverImageUrl && (
                <Link href={`/journals/${issue.journal.slug}`} className="shrink-0" title={`View ${issue.journal.title}`}>
                  <div className="w-10 h-14 rounded overflow-hidden border border-slate-700/80 shadow bg-navy-900 hover:opacity-90 transition-opacity">
                    <img
                      src={issue.journal.coverImageUrl}
                      alt={issue.journal.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
              )}
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2 text-xs text-blue-400 font-semibold uppercase">
                  <Link href={`/journals/${issue.journal.slug}`} className="hover:underline">
                    {issue.journal.title}
                  </Link>
                  <span>•</span>
                  <span>Vol. {issue.volume.volumeNumber}, No. {issue.issueNumber} ({issue.year})</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {issue.journal.abbreviation} • Open Access
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold scholarly-heading">{issue.title}</h1>
            {issue.editorialIntroduction && (
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed italic pt-2">
                &ldquo;{issue.editorialIntroduction}&rdquo;
              </p>
            )}
            <div className="text-xs text-slate-400 pt-1">
              <span>Published: {issue.publicationDate ? new Date(issue.publicationDate).toLocaleDateString() : 'Recent'}</span>
              <span className="mx-2">•</span>
              <span className="text-emerald-400 font-semibold">{issue.publishedArticles.length} Published Articles</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {issue.coverImageUrl ? (
              <div className="w-32 sm:w-40 rounded-lg overflow-hidden border-2 border-slate-700/60 shadow-xl bg-navy-900" title="Issue Cover">
                <img
                  src={issue.coverImageUrl}
                  alt={`${issue.title} cover`}
                  className="w-full h-auto aspect-[3/4] object-cover"
                />
              </div>
            ) : issue.journal.coverImageUrl ? (
              <div className="w-32 sm:w-40 rounded-lg overflow-hidden border-2 border-slate-700/60 shadow-xl bg-navy-900" title={`${issue.journal.title} Cover`}>
                <img
                  src={issue.journal.coverImageUrl}
                  alt={`${issue.journal.title} cover`}
                  className="w-full h-auto aspect-[3/4] object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-8 space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Articles in this Issue ({issue.publishedArticles.length})
          </h2>

          <div className="divide-y divide-slate-100">
            {issue.publishedArticles.map((article) => {
              const authors = article.submission.coAuthors
                .map((a) => `${a.firstName} ${a.lastName}`)
                .join(', ');

              return (
                <div key={article.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-bold text-slate-900 scholarly-heading hover:text-blue-700">
                      <Link href={`/articles/${article.id}`}>{article.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">{authors}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {article.abstract}
                    </p>
                    {article.doi && (
                      <div className="text-[11px] font-mono text-slate-500">
                        DOI: https://doi.org/{article.doi}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs flex-shrink-0">
                    <Link
                      href={`/articles/${article.id}`}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 rounded font-semibold transition-colors"
                    >
                      Read Article
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
