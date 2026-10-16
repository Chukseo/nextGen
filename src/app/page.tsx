import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  UploadCloud,
  CheckCircle,
  FileText,
  Shield,
  Layers,
  Award,
  ArrowRight,
  ExternalLink,
  Users
} from 'lucide-react';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Fresh research data

export default async function HomePage() {
  let journals: any[] = [];
  let publishedArticles: any[] = [];
  let latestIssue: any = null;

  try {
    [journals, publishedArticles, latestIssue] = await Promise.all([
      prisma.journal.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { publishedArticles: true, submissions: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.publishedArticle.findMany({
        take: 4,
        orderBy: { publishedAt: 'desc' },
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
      }),
      prisma.issue.findFirst({
        where: { status: 'PUBLISHED' },
        include: {
          journal: true,
          volume: true,
          publishedArticles: { take: 3 },
        },
        orderBy: { publicationDate: 'desc' },
      }),
    ]);
  } catch (error) {
    console.error('HomePage database query warning:', error);
  }

  return (
    <div className="space-y-16 pb-16">
      {/* Scholarly Hero Section with Faded Unsplash Image & Navy Solid Overlay */}
      <section className="relative bg-navy-950 text-white pt-20 pb-24 px-4 sm:px-8 border-b border-navy-800 overflow-hidden">
        {/* Background Image Layer with Milder Scholarly Overlay */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <img
            src="/hero-bg.jpg"
            alt="Scholarly Research Library Architecture"
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-65 filter brightness-100 contrast-105"
          />
          {/* Milder Navy Tint Overlay - Keeps the library architecture vivid and clearly visible */}
          <div className="absolute inset-0 bg-navy-950/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/75 via-navy-950/35 to-navy-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 bg-blue-900/60 border border-blue-700/50 rounded-full px-3 py-1 text-xs text-blue-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Open Access Scholarly Publishing Ecosystem</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold scholarly-heading tracking-tight leading-tight">
              NextGen Research & Innovation Press
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light">
              Advancing high-impact, peer-reviewed scholarship across computing, artificial intelligence, cyber-physical engineering, and translational healthcare sciences.
            </p>
          </div>

          {/* Quick Search Bar */}
          <div className="max-w-3xl bg-white p-2 rounded-xl shadow-2xl flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 flex items-center px-3 space-x-2 w-full text-slate-400">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles by title, author, keyword, or DOI..."
                className="w-full py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <Link
              href="/articles"
              className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1 shadow"
            >
              <span>Explore Library</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Navigation Badges */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-2">
            <span className="text-slate-400 font-medium">Browse Subjects:</span>
            <Link href="/articles?discipline=Machine+Learning" className="hover:text-blue-300 underline underline-offset-4">Machine Learning</Link>
            <Link href="/articles?discipline=Formal+Methods" className="hover:text-blue-300 underline underline-offset-4">Formal Verification</Link>
            <Link href="/articles?discipline=Distributed+Systems" className="hover:text-blue-300 underline underline-offset-4">Distributed Systems</Link>
            <Link href="/articles?discipline=Biomedical" className="hover:text-blue-300 underline underline-offset-4">Biomedical Informatics</Link>
          </div>
        </div>
      </section>

      {/* Key Scholarly Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Double-Anonymous Review</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standardized rigorous academic editorial workflow ensuring unbiased expert technical assessment and reproducibility checks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Crossref DOI Infrastructure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Persistent, machine-readable digital object identifiers registered directly with Crossref for permanent scholarly citation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Diamond Open Access</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Free to read, download, and cite globally under CC BY 4.0. No paywalls or reading restrictions for the scientific community.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">COPE Ethics Standards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Uncompromising publication ethics, conflict-of-interest declarations, data availability mandates, and transparent corrections.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Published Research Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Peer-Reviewed Scholarship</span>
            <h2 className="text-2xl font-bold text-slate-900 scholarly-heading">Latest Published Articles</h2>
          </div>
          <Link href="/articles" className="text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1">
            <span>View all articles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {publishedArticles.map((article: any) => {
            const authorNames = (article.submission?.coAuthors || [])
              .map((a: any) => `${a.firstName} ${a.lastName}`)
              .join(', ');

            return (
              <article
                key={article.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {article.journal.abbreviation}
                    </span>
                    <span>{new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 scholarly-heading hover:text-blue-700 transition-colors leading-snug">
                    <Link href={`/articles/${article.id}`}>
                      {article.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-slate-600 font-medium">
                    {authorNames}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed scholarly-abstract">
                    {article.abstract}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {article.doi && (
                    <span className="font-mono text-slate-500 flex items-center space-x-1">
                      <span className="font-bold text-slate-700">DOI:</span>
                      <span className="hover:text-blue-700 truncate max-w-[200px]">{article.doi}</span>
                    </span>
                  )}
                  <Link
                    href={`/articles/${article.id}`}
                    className="font-semibold text-blue-700 hover:text-blue-800 flex items-center space-x-1 ml-auto"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Multidisciplinary Journals Section */}
      <section className="bg-slate-100/70 py-16 px-4 sm:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Publishing Portfolio</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 scholarly-heading">
              Journals Under NextGen Press
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Each journal operates with an autonomous editorial board, dedicated reviewer pool, and independent publication schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {journals.map((journal) => (
              <div
                key={journal.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-0 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Cover Image or Fallback Slug Banner */}
                {journal.coverImageUrl ? (
                  <Link href={`/journals/${journal.slug}`} className="block w-full overflow-hidden bg-slate-100">
                    <img
                      src={journal.coverImageUrl}
                      alt={journal.title}
                      className="w-full h-40 object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </Link>
                ) : (
                  <div className="w-full h-24 bg-navy-950 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl tracking-widest opacity-60">
                      {journal.slug.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {!journal.coverImageUrl && (
                      <div className="w-10 h-10 bg-navy-950 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {journal.slug.toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-base font-bold text-slate-900 scholarly-heading">
                      <Link href={`/journals/${journal.slug}`} className="hover:text-blue-700">
                        {journal.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {journal.description}
                    </p>
                    <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                      <div><span className="font-bold">Online ISSN:</span> {journal.onlineIssn || 'Pending'}</div>
                      <div><span className="font-bold">Policy:</span> {journal.peerReviewPolicy}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      href={`/journals/${journal.slug}`}
                      className="text-blue-700 font-semibold hover:text-blue-900 flex items-center space-x-1"
                    >
                      <span>View Journal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/submit?journal=${journal.id}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded transition-colors"
                    >
                      Submit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Author Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-navy-900 text-white rounded-2xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Call for Submissions</span>
            <h2 className="text-2xl sm:text-3xl font-bold scholarly-heading">
              Publish Your Next Breakthrough with NextGen Press
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Experience a streamlined, respectful editorial process. Authors retain full copyright under Creative Commons Attribution licenses, with rapid desk screening, rigorous double-anonymous peer review, and automated Crossref DOI registration upon acceptance.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow transition-colors flex items-center justify-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit Manuscript (DOC/DOCX)</span>
            </Link>
            <Link
              href="/editorial-policies"
              className="border border-slate-500 hover:border-slate-300 text-slate-200 text-sm px-5 py-3 rounded-lg font-medium transition-colors text-center"
            >
              Submission Guidelines
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
