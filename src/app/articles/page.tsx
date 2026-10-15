import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Search, BookOpen, ArrowRight, Download, Filter } from 'lucide-react';

export const revalidate = 0;

export default async function ArticlesSearchPage({
  searchParams,
}: {
  searchParams: { q?: string; journal?: string; discipline?: string; year?: string };
}) {
  const query = searchParams.q?.trim() || '';
  const journalSlug = searchParams.journal;
  const discipline = searchParams.discipline;
  const year = searchParams.year;

  let where: any = {
    submission: {
      status: 'PUBLISHED',
    },
  };

  if (journalSlug) {
    where.journal = { slug: journalSlug };
  }

  if (discipline) {
    where.submission = {
      ...where.submission,
      discipline: { contains: discipline },
    };
  }

  if (year) {
    where.issue = {
      year: Number(year),
    };
  }

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { abstract: { contains: query } },
      { doi: { contains: query } },
      {
        submission: {
          coAuthors: {
            some: {
              OR: [
                { firstName: { contains: query } },
                { lastName: { contains: query } },
                { affiliation: { contains: query } },
              ],
            },
          },
        },
      },
      {
        keywords: {
          some: {
            keyword: { contains: query },
          },
        },
      },
    ];
  }

  const [articles, journals] = await Promise.all([
    prisma.publishedArticle.findMany({
      where,
      include: {
        journal: { select: { title: true, abbreviation: true, slug: true } },
        issue: { include: { volume: true } },
        submission: {
          include: {
            coAuthors: { orderBy: { authorOrder: 'asc' } },
          },
        },
        keywords: true,
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.journal.findMany({ select: { id: true, title: true, slug: true, abbreviation: true } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-10">
      {/* Search Header */}
      <div className="border-b border-slate-200 pb-8 space-y-4">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Research Repository</span>
        <h1 className="text-3xl font-bold text-slate-900 scholarly-heading">
          Scholarly Articles & Publications
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Search, read, and freely download verified peer-reviewed articles published by NextGen Research and Innovation Press.
        </p>

        {/* Search Bar Form */}
        <form method="GET" action="/articles" className="pt-2 flex flex-col sm:flex-row gap-3 max-w-4xl">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by keywords, author name, article title, or DOI (e.g., 10.5555)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>Search</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              <Filter className="w-4 h-4 text-blue-700" />
              <span>Filter Results</span>
            </div>

            {/* Filter by Journal */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Journal</label>
              <div className="space-y-1 text-xs">
                <Link
                  href="/articles"
                  className={`block px-2 py-1 rounded ${!journalSlug ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  All Journals
                </Link>
                {journals.map((j) => (
                  <Link
                    key={j.id}
                    href={`/articles?journal=${j.slug}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                    className={`block px-2 py-1 rounded ${journalSlug === j.slug ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {j.abbreviation}
                  </Link>
                ))}
              </div>
            </div>

            {/* Filter by Discipline */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase">Subject Area</label>
              <div className="space-y-1 text-xs">
                <Link
                  href={`/articles?discipline=Machine+Learning${journalSlug ? `&journal=${journalSlug}` : ''}`}
                  className="block px-2 py-1 rounded text-slate-600 hover:bg-slate-50"
                >
                  Machine Learning
                </Link>
                <Link
                  href={`/articles?discipline=Cryptography${journalSlug ? `&journal=${journalSlug}` : ''}`}
                  className="block px-2 py-1 rounded text-slate-600 hover:bg-slate-50"
                >
                  Cryptography & Security
                </Link>
                <Link
                  href={`/articles?discipline=Distributed${journalSlug ? `&journal=${journalSlug}` : ''}`}
                  className="block px-2 py-1 rounded text-slate-600 hover:bg-slate-50"
                >
                  Distributed Computing
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing {articles.length} published peer-reviewed articles</span>
            {query && (
              <span>Matching &quot;<strong>{query}</strong>&quot;</span>
            )}
          </div>

          {articles.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No published articles match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search terms or clearing journal filters to explore other peer-reviewed papers.
              </p>
              <div className="pt-2">
                <Link href="/articles" className="text-xs text-blue-700 font-semibold hover:underline">
                  Clear all filters
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => {
                const authors = article.submission.coAuthors
                  .map((a) => `${a.firstName} ${a.lastName}`)
                  .join(', ');

                return (
                  <article
                    key={article.id}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {article.journal.abbreviation}
                        </span>
                        <span>Vol. {article.issue.volume.volumeNumber}, Iss. {article.issue.issueNumber}</span>
                      </div>
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 scholarly-heading hover:text-blue-700">
                      <Link href={`/articles/${article.id}`}>{article.title}</Link>
                    </h2>

                    <p className="text-xs text-slate-700 font-semibold">
                      {authors}
                    </p>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed scholarly-abstract">
                      {article.abstract}
                    </p>

                    {article.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {article.keywords.map((k) => (
                          <span
                            key={k.id}
                            className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded"
                          >
                            {k.keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {article.doi && (
                        <span className="font-mono text-slate-600">
                          <strong>DOI:</strong> {article.doi}
                        </span>
                      )}
                      <div className="flex items-center space-x-3 ml-auto">
                        <Link
                          href={`/articles/${article.id}`}
                          className="font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <span>View Article Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
