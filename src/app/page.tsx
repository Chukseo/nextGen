import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
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
  Users,
  GraduationCap,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getBaseUrl } from '@/lib/siteUrl';
import AcademicTrustSection from '@/components/home/AcademicTrustSection';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Fresh research data

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl();
  return {
    title: 'NextGen Innovation & Research Journals | Peer-Reviewed Open Access Publishing',
    description: 'Digital scholarly academic journal publisher based in London, UK advancing computer science, artificial intelligence, healthcare, and multidisciplinary research.',
    alternates: { canonical: baseUrl },
    openGraph: {
      title: 'NextGen Innovation & Research Journals | Peer-Reviewed Open Access Publishing',
      description: 'Advancing global scholarly discovery with peer-reviewed open access journals.',
      url: baseUrl,
    },
  };
}

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
        take: 6,
        orderBy: { publishedAt: 'desc' },
        include: {
          journal: { select: { title: true, abbreviation: true, slug: true, coverImageUrl: true } },
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
              NextGen Innovation & Research Journals
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

      {/* Key Scholarly Pillars & Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="apple-glass-card p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center shadow-xs">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Double-Anonymous Review</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standardized rigorous academic editorial workflow ensuring unbiased expert technical assessment and reproducibility checks.
            </p>
          </div>

          <div className="apple-glass-card p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Crossref DOI Infrastructure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Persistent, machine-readable digital object identifiers registered directly with Crossref for permanent scholarly citation.
            </p>
          </div>

          <div className="apple-glass-card p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Diamond Open Access</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Free to read, download, and cite globally under CC BY 4.0. No paywalls or reading restrictions for the scientific community.
            </p>
          </div>

          <div className="apple-glass-card p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">COPE Ethics Standards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Uncompromising publication ethics, conflict-of-interest declarations, data availability mandates, and transparent corrections.
            </p>
          </div>

          <div className="apple-glass-card p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-sky-50 text-sky-700 rounded-xl flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Google Scholar & Global Indexing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Comprehensive highwire metadata tags, automated sitemap feeds, and full-text harvest integration across Google Scholar and library discovery systems.
            </p>
          </div>

          <div className="apple-glass-card p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-700 rounded-xl flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">2-Year Impact Factor Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent, citation-tracked 2-year Journal Impact Factor (JIF) calculations, immediacy metrics, and annual citable item reports across all journals.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Published Research Articles (Always Featured Across All Journals) */}
      <AcademicTrustSection />

      {/* Featured Published Research Articles (Always Featured Across All Journals) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Recently Published Scholarship</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 scholarly-heading mt-1">
              ## Latest Published Articles Across NextGen
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Peer-reviewed open-access discoveries published in real time across all participating journals.
            </p>
          </div>
          <Link href="/articles" className="text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1 shrink-0">
            <span>Explore all articles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {publishedArticles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">New Articles Forthcoming</h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Articles across NextGen Innovation & Research Journals are currently advancing through editorial desk screening, double-anonymous peer review, and typeset production.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/submit"
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                Submit Manuscript
              </Link>
              <Link
                href="/issues"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                Browse Current Issues
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedArticles.map((article: any) => {
              const authorNames = (article.submission?.coAuthors || [])
                .map((a: any) => `${a.firstName} ${a.lastName}`)
                .join(', ');

              return (
                <article
                  key={article.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {article.journal.coverImageUrl && (
                          <div className="w-6 h-8 rounded overflow-hidden border border-slate-200 shadow-xs shrink-0 hidden sm:block">
                            <img
                              src={article.journal.coverImageUrl}
                              alt={article.journal.abbreviation}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <Link
                          href={`/journals/${article.journal.slug}`}
                          className="font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 text-[11px] transition-colors"
                        >
                          {article.journal.abbreviation}
                        </Link>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      {article.issue && (
                        <div className="text-[10px] text-slate-400 font-medium mb-1">
                          Vol. {article.issue.volume?.volumeNumber || 1}, No. {article.issue.issueNumber} ({article.issue.year})
                        </div>
                      )}
                      <h3 className="text-base font-bold text-slate-900 scholarly-heading group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                        <Link href={`/articles/${article.slug || article.id}`}>
                          {article.title}
                        </Link>
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 font-medium line-clamp-1">
                      {authorNames}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed scholarly-abstract">
                      {article.abstract}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {(article.zenodoDoi || (article.doi && !article.doi.startsWith('10.5555'))) ? (
                      <span className="font-mono text-[11px] text-slate-500 truncate max-w-[150px]" title={article.zenodoDoi || article.doi}>
                        DOI: {article.zenodoDoi || article.doi}
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Open Access
                      </span>
                    )}
                    <Link
                      href={`/articles/${article.slug || article.id}`}
                      className="font-semibold text-blue-700 hover:text-blue-800 flex items-center space-x-1 ml-auto"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Multidisciplinary Journals Section */}
      <section className="bg-slate-100/70 py-16 px-4 sm:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Publishing Portfolio</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 scholarly-heading">
              NextGen Innovation & Research Journals
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

      {/* Strategic Publishing Partnership Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-3xl border border-slate-200/90 shadow-lg p-8 sm:p-12">
          {/* Decorative glowing gradient backdrop */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Strategic Scholarly Publishing Partnership</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 scholarly-heading tracking-tight">
                LOU Publishing and Information Services
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                NextGen Innovation & Research Journals proudly collaborates with <strong>LOU Publishing and Information Services</strong> to elevate scholarly communication, bibliographic archiving, and open-science digital distribution across African and international research communities.
              </p>

              {/* Contact Directory Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700">
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">Headquarters</span>
                    <span>20 Nnamdi Crescent Street Asaba, Delta State, Nigeria</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">Direct Telephone</span>
                    <a href="tel:+2348055821283" className="text-blue-700 font-semibold hover:underline">+234 8055821283</a>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
                  <Mail className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">Official Email</span>
                    <a href="mailto:loupublishinginfo@gmail.com" className="text-blue-700 font-semibold hover:underline truncate block">loupublishinginfo@gmail.com</a>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
                  <Globe className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">Publishing Web Portal</span>
                    <a href="https://loupublishing.onrender.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold hover:underline inline-flex items-center gap-1">
                      <span>loupublishing.onrender.com</span>
                      <ExternalLink className="w-3 h-3 text-blue-500" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="lg:w-72 w-full flex flex-col justify-center items-center text-center p-6 bg-navy-950 text-white rounded-2xl shadow-md border border-navy-800 space-y-4 shrink-0">
              <div className="w-14 h-14 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center">
                <Globe className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-white">Partner Portal</h4>
                <p className="text-xs text-slate-300">Explore bibliographic services, monographs, and academic archives.</p>
              </div>
              <a
                href="https://loupublishing.onrender.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Visit LOU Publishing</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Author Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-navy-900 text-white rounded-2xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Call for Submissions</span>
            <h2 className="text-2xl sm:text-3xl font-bold scholarly-heading">
              Publish Your Next Breakthrough with NextGen Innovation & Research Journals
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
