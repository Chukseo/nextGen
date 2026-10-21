import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import JournalHeader from '@/components/JournalHeader';
import { BookOpen, ArrowRight, Download, FileText, Star, ArrowLeft } from 'lucide-react';
import { getBaseUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
    select: { title: true, slug: true, abbreviation: true },
  });

  if (!journal) {
    return { title: 'Current Issue | NextGen Innovation & Research Journals' };
  }

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/journals/${journal.slug}/current`;

  return {
    title: `Current Issue | ${journal.title}`,
    description: `Latest research articles and publications in the current issue of ${journal.title}.`,
    alternates: { canonical },
  };
}

export default async function JournalCurrentIssuePage({
  params,
}: Props) {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
    include: {
      issues: {
        where: { status: 'PUBLISHED' },
        include: {
          volume: true,
          publishedArticles: {
            include: {
              submission: {
                include: { coAuthors: { orderBy: { authorOrder: 'asc' } } },
              },
            },
            orderBy: { publishedAt: 'desc' },
          },
        },
        orderBy: [
          { isCurrent: 'desc' },
          { year: 'desc' },
          { issueNumber: 'desc' },
        ],
      },
    },
  });

  if (!journal) {
    notFound();
  }

  // Find the designated current issue, or fallback to the latest published issue
  const currentIssue = journal.issues.find((i) => i.isCurrent) || journal.issues[0];

  return (
    <div className="space-y-10 pb-16">
      {/* Journal Masthead & Subnav Menu */}
      <JournalHeader journal={journal} activeTab="current" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {!currentIssue ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm max-w-2xl mx-auto">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
              Inaugural Issue in Production
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              The inaugural issue for {journal.title} is currently completing final desk review and article typesetting. Published research will be showcased here upon release.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href={`/submit?journal=${journal.id}`}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Submit Manuscript to {journal.abbreviation}
              </Link>
              <Link
                href={`/journals/${journal.slug}`}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors"
              >
                Journal Overview
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Current Issue Masthead */}
            <div className="bg-navy-950 text-white p-6 sm:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 border-b border-navy-900">
              <div className="flex gap-6 items-start flex-1">
                {(currentIssue.coverImageUrl || journal.coverImageUrl) && (
                  <div className="w-24 sm:w-28 flex-shrink-0 rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl bg-navy-900 hidden sm:block">
                    <img
                      src={(currentIssue.coverImageUrl || journal.coverImageUrl) || undefined}
                      alt={currentIssue.title}
                      className="w-full h-auto aspect-[3/4] object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded shadow-sm inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>CURRENT ISSUE</span>
                    </span>
                    <span className="text-xs text-blue-400 font-semibold uppercase">
                      Vol. {currentIssue.volume.volumeNumber}, No. {currentIssue.issueNumber} ({currentIssue.year})
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold scholarly-heading">
                    {currentIssue.title}
                  </h2>

                  {currentIssue.description && (
                    <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-light">
                      {currentIssue.description}
                    </p>
                  )}

                  {currentIssue.editorialIntroduction && (
                    <p className="text-xs text-slate-400 max-w-3xl leading-relaxed italic pt-1 border-t border-slate-800">
                      &ldquo;{currentIssue.editorialIntroduction}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-400 flex flex-col md:items-end flex-shrink-0 space-y-1">
                <div>
                  <span className="text-slate-500">Released: </span>
                  <span className="text-slate-300 font-medium">
                    {currentIssue.publicationDate ? new Date(currentIssue.publicationDate).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-400 font-semibold">
                    {currentIssue.publishedArticles.length} {currentIssue.publishedArticles.length === 1 ? 'Article' : 'Articles'}
                  </span>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/issues/${currentIssue.id}`}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <span>Permanent Issue URL</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Table of Contents
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {currentIssue.publishedArticles.length} Published Articles
                </span>
              </div>

              {currentIssue.publishedArticles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  Articles for this current issue are in final typeset production and DOI assignment.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {currentIssue.publishedArticles.map((article) => {
                    const authors = article.submission.coAuthors
                      .map((a) => `${a.firstName} ${a.lastName}`)
                      .join(', ');

                    return (
                      <div
                        key={article.id}
                        className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-slate-50/60 transition-colors p-3 rounded-lg"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {article.submission.articleType || 'Research Article'}
                            </span>
                            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                            {article.pageRange && (
                              <span>• pp. {article.pageRange}</span>
                            )}
                          </div>

                          <h4 className="text-base sm:text-lg font-bold text-slate-900 scholarly-heading hover:text-blue-700 transition-colors leading-snug">
                            <Link href={`/articles/${article.slug || article.id}`}>
                              {article.title}
                            </Link>
                          </h4>

                          <p className="text-xs text-slate-600 font-medium">
                            {authors}
                          </p>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed scholarly-abstract">
                            {article.abstract}
                          </p>

                          {article.doi && (
                            <div className="text-[11px] font-mono text-slate-500 pt-1">
                              DOI: https://doi.org/{article.doi}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0">
                          <Link
                            href={`/articles/${article.slug || article.id}`}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs px-3.5 py-1.5 rounded transition-colors"
                          >
                            Read Article
                          </Link>
                          <a
                            href={`/api/articles/${article.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs px-3.5 py-1.5 rounded transition-colors inline-flex items-center space-x-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
