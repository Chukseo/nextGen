import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import JournalHeader from '@/components/JournalHeader';
import { BookOpen, Layers, ArrowRight, Star } from 'lucide-react';
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
    return { title: 'Archive | NextGen Innovation & Research Journals' };
  }

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/journals/${journal.slug}/archive`;

  return {
    title: `Issue Archives | ${journal.title}`,
    description: `Complete archive of past volumes and issues for ${journal.title} (${journal.abbreviation || 'Open Access'}).`,
    alternates: { canonical },
  };
}

export default async function JournalArchivePage({
  params,
}: Props) {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
    include: {
      volumes: {
        include: {
          issues: {
            where: { status: 'PUBLISHED' },
            include: {
              _count: { select: { publishedArticles: true } },
            },
            orderBy: [{ issueNumber: 'desc' }],
          },
        },
        orderBy: [{ volumeNumber: 'desc' }],
      },
    },
  });

  if (!journal) {
    notFound();
  }

  const allPublishedIssues = journal.volumes.flatMap((v) =>
    v.issues.map((i) => ({ ...i, volumeNumber: v.volumeNumber, volumeYear: v.year }))
  );

  return (
    <div className="space-y-10 pb-16">
      {/* Journal Masthead & Subnav Menu */}
      <JournalHeader journal={journal} activeTab="archive" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 scholarly-heading">
              Issue Archives & Published Volumes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Complete catalog of archived volumes and issues published by {journal.title}.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {allPublishedIssues.length} {allPublishedIssues.length === 1 ? 'Issue' : 'Issues'} &bull; {journal.volumes.length} Volumes
          </span>
        </div>

        {allPublishedIssues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm max-w-lg mx-auto">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Archived Issues Yet</h3>
            <p className="text-xs text-slate-500">
              Past volumes will be archived here as new issues are published.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {journal.volumes.map((volume) => {
              if (volume.issues.length === 0) return null;

              return (
                <div key={volume.id} className="space-y-4">
                  <div className="flex items-center space-x-3 pb-2 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 scholarly-heading">
                      Volume {volume.volumeNumber} ({volume.year})
                    </h3>
                    <span className="text-xs text-slate-500">
                      {volume.issues.length} {volume.issues.length === 1 ? 'Issue' : 'Issues'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {volume.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                          issue.isCurrent ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                        }`}
                      >
                        <div>
                          {issue.coverImageUrl ? (
                            <Link href={`/issues/${issue.id}`} className="block w-full aspect-[16/10] overflow-hidden bg-slate-100">
                              <img
                                src={issue.coverImageUrl}
                                alt={issue.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              />
                            </Link>
                          ) : journal.coverImageUrl ? (
                            <Link href={`/issues/${issue.id}`} className="block w-full aspect-[16/10] overflow-hidden bg-slate-100">
                              <img
                                src={journal.coverImageUrl}
                                alt={journal.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              />
                            </Link>
                          ) : (
                            <div className="w-full aspect-[16/10] bg-navy-950 flex flex-col items-center justify-center text-white p-4">
                              <BookOpen className="w-8 h-8 text-blue-400 mb-1" />
                              <span className="text-xs font-bold text-slate-300">
                                Vol. {volume.volumeNumber}, No. {issue.issueNumber}
                              </span>
                            </div>
                          )}

                          <div className="p-5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                                Vol. {volume.volumeNumber}, No. {issue.issueNumber} ({issue.year})
                              </span>
                              {issue.isCurrent && (
                                <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded shadow-sm inline-flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  <span>CURRENT</span>
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-blue-700">
                              <Link href={`/issues/${issue.id}`}>{issue.title}</Link>
                            </h4>

                            {issue.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {issue.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-5 pt-0 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            {issue._count.publishedArticles} Articles
                          </span>
                          <Link
                            href={`/issues/${issue.id}`}
                            className="font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <span>Table of Contents</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
