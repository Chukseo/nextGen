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
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl();
  return {
    title: 'NextGen Innovation & Research Journals | Peer-Reviewed Open Access Publishing',
    description: 'Digital scholarly academic journal publisher based at Gower Street, London, United Kingdom, affiliated with University College London (UCL) and in strategic partnership with LOU Publishing, advancing computer science, artificial intelligence, healthcare, and multidisciplinary research.',
    alternates: { canonical: baseUrl },
    openGraph: {
      title: 'NextGen Innovation & Research Journals | Peer-Reviewed Open Access Publishing',
      description: 'Advancing global scholarly discovery with peer-reviewed open access journals. Affiliated with University College London (UCL) and in partnership with LOU Publishing. Gower Street, London, United Kingdom.',
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

  const pillars = [
    {
      icon: CheckCircle,
      title: 'Double-Anonymous Review',
      desc: 'Standardized rigorous academic editorial workflow ensuring unbiased expert technical assessment and reproducibility checks.',
      colorBg: 'bg-blue-50 group-hover:bg-blue-100',
      colorIcon: 'text-blue-700',
      colorHover: 'group-hover:text-blue-700',
      delay: '',
    },
    {
      icon: Award,
      title: 'DOI Infrastructure',
      desc: 'Persistent, machine-readable digital object identifiers registered directly with Zenodo for permanent scholarly citation.',
      colorBg: 'bg-emerald-50 group-hover:bg-emerald-100',
      colorIcon: 'text-emerald-700',
      colorHover: 'group-hover:text-emerald-700',
      delay: 'delay-75',
    },
    {
      icon: BookOpen,
      title: 'Open Access Publishing',
      desc: 'Free to read, download, and cite globally under CC BY 4.0. No paywalls, no author fees, and no reading restrictions for the scientific community.',
      colorBg: 'bg-amber-50 group-hover:bg-amber-100',
      colorIcon: 'text-amber-700',
      colorHover: 'group-hover:text-amber-700',
      delay: 'delay-150',
    },
    {
      icon: Shield,
      title: 'COPE Ethics Standards',
      desc: 'Uncompromising publication ethics, conflict-of-interest declarations, data availability mandates, and transparent corrections.',
      colorBg: 'bg-purple-50 group-hover:bg-purple-100',
      colorIcon: 'text-purple-700',
      colorHover: 'group-hover:text-purple-700',
      delay: 'delay-225',
    },
    {
      icon: GraduationCap,
      title: 'Google Scholar & Global Indexing',
      desc: 'Comprehensive highwire metadata tags, automated sitemap feeds, and full-text harvest integration across Google Scholar and library discovery systems.',
      colorBg: 'bg-sky-50 group-hover:bg-sky-100',
      colorIcon: 'text-sky-700',
      colorHover: 'group-hover:text-sky-700',
      delay: 'delay-300',
    },
    {
      icon: TrendingUp,
      title: '2-Year Impact Factor Reports',
      desc: 'Transparent, citation-tracked 2-year Journal Impact Factor (JIF) calculations, immediacy metrics, and annual citable item reports across all journals.',
      colorBg: 'bg-rose-50 group-hover:bg-rose-100',
      colorIcon: 'text-rose-700',
      colorHover: 'group-hover:text-rose-700',
      delay: 'delay-375',
    },
  ];

  return (
    <div className="space-y-20 pb-20">

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative bg-navy-950 text-white pt-20 pb-28 px-4 sm:px-8 border-b border-navy-800/60 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/hero-bg.jpg"
            alt="Scholarly Research Library Architecture"
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-60 filter brightness-100 contrast-105"
          />
          {/* Layered overlays for depth */}
          <div className="absolute inset-0 bg-navy-950/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/80 via-navy-950/40 to-navy-950/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />

          {/* Animated orbs */}
          <div className="absolute -top-24 -left-24 w-[480px] h-[480px] bg-blue-500/18 rounded-full blur-3xl animate-orb pointer-events-none" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-indigo-500/12 rounded-full blur-3xl animate-orb-slow pointer-events-none" />
          <div className="absolute -bottom-16 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-5">
            {/* Badge */}
            <div className="inline-flex flex-wrap items-center gap-2 bg-white/8 border border-white/15 rounded-full px-4 py-1.5 text-xs text-blue-200 backdrop-blur-sm animate-fade-scale">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-medium">Open Access Scholarly Publishing Ecosystem</span>
              <span className="text-blue-500/60 hidden sm:inline">•</span>
              <span className="font-bold text-white hidden sm:inline">Affiliated with University College London (UCL)</span>
              <span className="text-blue-500/60 hidden md:inline">•</span>
              <span className="text-blue-200/80 hidden md:inline">In Partnership with LOU Publishing</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold scholarly-heading tracking-tight leading-[1.1] animate-slide-up" style={{ animationDelay: '80ms' }}>
              NextGen Innovation &amp; Research Journals
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light max-w-2xl animate-slide-up" style={{ animationDelay: '160ms' }}>
              Advancing high-impact, peer-reviewed scholarship across computing, artificial intelligence, cyber-physical engineering, and translational healthcare sciences. Headquartered at Gower Street, London, United Kingdom.
            </p>
          </div>

          {/* Search Bar */}
          <div
            className="max-w-3xl bg-white/96 backdrop-blur-xl p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-white/30 focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-400/60 transition-all duration-400 animate-slide-up"
            style={{ animationDelay: '240ms' }}
          >
            <div className="flex-1 flex items-center px-3 gap-2.5 w-full text-slate-400">
              <Search className="w-5 h-5 text-blue-600 shrink-0" />
              <input
                type="text"
                placeholder="Search articles by title, author, keyword, or DOI..."
                className="w-full py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
              />
            </div>
            <Link
              href="/articles"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md btn-shimmer btn-magnetic shrink-0"
            >
              <span>Explore Library</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Quick nav badges */}
          <div
            className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-1 animate-slide-up"
            style={{ animationDelay: '320ms' }}
          >
            <span className="text-slate-400 font-medium">Browse Subjects:</span>
            {[
              { label: 'Machine Learning', discipline: 'Machine+Learning' },
              { label: 'Formal Verification', discipline: 'Formal+Methods' },
              { label: 'Distributed Systems', discipline: 'Distributed+Systems' },
              { label: 'Biomedical Informatics', discipline: 'Biomedical' },
            ].map((sub) => (
              <Link
                key={sub.label}
                href={`/articles?discipline=${sub.discipline}`}
                className="px-3 py-1 rounded-full bg-white/8 hover:bg-white/18 text-slate-200 hover:text-white border border-white/12 hover:border-white/30 backdrop-blur-xs transition-all duration-250 hover:-translate-y-0.5 hover:shadow-sm"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scholarly Pillars ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p) => (
            <div
              key={p.title}
              className={`reveal-on-scroll ${p.delay} glass-card card-gradient-reveal article-card-hover group p-6 rounded-2xl space-y-3 cursor-default`}
            >
              <div className={`w-10 h-10 ${p.colorBg} ${p.colorIcon} rounded-xl flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110`}>
                <p.icon className="w-5 h-5" />
              </div>
              <h3 className={`font-bold text-slate-900 text-base ${p.colorHover} transition-colors duration-200`}>{p.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Academic Trust Section ─────────────────────────────── */}
      <AcademicTrustSection />

      {/* ── Latest Articles ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 pb-5 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Recently Published Scholarship</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 scholarly-heading mt-1">
              Latest Published Articles Across NextGen
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Peer-reviewed open-access discoveries published in real time across all participating journals.
            </p>
          </div>
          <Link href="/articles" className="text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 shrink-0 group transition-colors">
            <span>Explore all articles</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {publishedArticles.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">New Articles Forthcoming</h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Articles across NextGen Innovation &amp; Research Journals are currently advancing through editorial desk screening, double-anonymous peer review, and typeset production.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/submit" className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm btn-magnetic">
                Submit Manuscript
              </Link>
              <Link href="/issues" className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2 rounded-lg transition-colors">
                Browse Current Issues
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publishedArticles.map((article: any, index: number) => {
              const authorNames = (article.submission?.coAuthors || [])
                .map((a: any) => `${a.firstName} ${a.lastName}`)
                .join(', ');
              const delayClass = `delay-${(index % 3) * 75 || ''}`.replace('delay-0', '');

              return (
                <article
                  key={article.id}
                  className={`reveal-on-scroll ${delayClass} glass-card article-card-hover card-gradient-reveal group flex flex-col justify-between space-y-4 p-5 rounded-2xl`}
                >
                  <div className="space-y-3">
                    {/* Journal badge + date */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {article.journal.coverImageUrl && (
                          <div className="w-6 h-8 rounded overflow-hidden border border-slate-200 shadow-xs shrink-0 hidden sm:block">
                            <img
                              src={article.journal.coverImageUrl}
                              alt={article.journal.abbreviation}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
                          Vol.&nbsp;{article.issue.volume?.volumeNumber || 1}, No.&nbsp;{article.issue.issueNumber} ({article.issue.year})
                        </div>
                      )}
                      <h3 className="text-base font-bold text-slate-900 scholarly-heading group-hover:text-blue-700 transition-colors duration-200 leading-snug line-clamp-2">
                        <Link href={`/articles/${article.slug || article.id}`}>{article.title}</Link>
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 font-medium line-clamp-1">{authorNames}</p>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed scholarly-abstract">{article.abstract}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {(article.zenodoDoi || (article.doi && !article.doi.startsWith('10.5555'))) ? (
                      <span className="font-mono text-[11px] text-slate-400 truncate max-w-[150px]" title={article.zenodoDoi || article.doi}>
                        DOI: {article.zenodoDoi || article.doi}
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Open Access
                      </span>
                    )}
                    <Link
                      href={`/articles/${article.slug || article.id}`}
                      className="font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 ml-auto group/btn transition-colors"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Journals Portfolio ─────────────────────────────────── */}
      <section className="relative py-20 px-4 sm:px-8 overflow-hidden">
        {/* Soft warm background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-blue-50/20 to-slate-50/80 pointer-events-none" />
        <div className="absolute inset-0 border-y border-slate-200/50 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Publishing Portfolio</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 scholarly-heading">
              NextGen Innovation &amp; Research Journals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Each journal operates with an autonomous editorial board, dedicated reviewer pool, and independent publication schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {journals.map((journal, idx: number) => (
              <div
                key={journal.id}
                className={`reveal-on-scroll delay-${idx * 75 || ''} glass-card card-gradient-reveal group flex flex-col overflow-hidden rounded-2xl`.replace('delay-0', '')}
              >
                {/* Cover */}
                {journal.coverImageUrl ? (
                  <Link href={`/journals/${journal.slug}`} className="block w-full overflow-hidden bg-slate-100">
                    <img
                      src={journal.coverImageUrl}
                      alt={journal.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </Link>
                ) : (
                  <div className="w-full h-28 bg-navy-950 flex items-center justify-center relative overflow-hidden group-hover:bg-navy-900 transition-colors duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="text-white font-bold text-2xl tracking-widest opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300 relative z-10">
                      {journal.slug.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {!journal.coverImageUrl && (
                      <div className="w-10 h-10 bg-navy-950 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-blue-700 transition-colors duration-250">
                        {journal.abbreviation?.slice(0, 3) || journal.slug.toUpperCase().slice(0, 3)}
                      </div>
                    )}
                    <h3 className="text-base font-bold text-slate-900 scholarly-heading group-hover:text-blue-700 transition-colors duration-200">
                      <Link href={`/journals/${journal.slug}`}>{journal.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{journal.description}</p>
                    <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-100/80">
                      <div><span className="font-bold text-slate-500">Online ISSN:</span> {journal.onlineIssn || 'Pending'}</div>
                      <div><span className="font-bold text-slate-500">Policy:</span> {journal.peerReviewPolicy}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
                    <Link
                      href={`/journals/${journal.slug}`}
                      className="text-blue-700 font-semibold hover:text-blue-900 flex items-center gap-1 group/btn transition-colors"
                    >
                      <span>View Journal</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </Link>
                    <Link
                      href={`/submit?journal=${journal.id}`}
                      className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition-all duration-250 btn-magnetic text-[11px]"
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

      {/* ── Partnerships ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200/70">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200 mb-2">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>Academic Affiliation &amp; Publishing Alliances</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 scholarly-heading tracking-tight">
              Institutional Affiliation &amp; Strategic Partners
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Partnering with global academic institutions and scholarly service providers to guarantee editorial rigour, persistent archiving, and equitable open access.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* UCL Card */}
          <div className="reveal-on-scroll glass-card card-gradient-reveal relative overflow-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-blue-200/60 hover:border-blue-300">
            {/* Background shimmer orb */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/8 rounded-full blur-2xl pointer-events-none group-hover:opacity-100 transition-opacity" />

            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>Affiliated Institution &amp; Research Partner</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 scholarly-heading tracking-tight">
                University College London (UCL)
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                NextGen Innovation &amp; Research Journals operates with academic and research affiliation with <strong className="text-slate-700">University College London (UCL)</strong> to advance frontier scientific inquiry, cross-disciplinary computing, and equitable worldwide open-access dissemination under CC BY 4.0.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                {[
                  { icon: MapPin, iconColor: 'text-blue-500', title: 'Campus Location', value: 'Gower Street, London, United Kingdom', hover: 'hover:border-blue-300' },
                  { icon: Award, iconColor: 'text-emerald-500', title: 'Institutional Affiliation', value: 'University College London (UCL)', hover: 'hover:border-emerald-300' },
                  { icon: Mail, iconColor: 'text-rose-500', title: 'Editorial Inquiries', value: 'nextgenjournals@gmail.com', href: 'mailto:nextgenjournals@gmail.com', hover: 'hover:border-rose-300' },
                  { icon: Globe, iconColor: 'text-indigo-500', title: 'Institutional Portal', value: 'ucl.ac.uk', href: 'https://www.ucl.ac.uk', external: true, hover: 'hover:border-indigo-300' },
                ].map((item) => (
                  <div key={item.title} className={`flex items-start gap-2.5 p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-xs ${item.hover} transition-all duration-250 hover:shadow-sm`}>
                    <item.icon className={`w-4 h-4 ${item.iconColor} shrink-0 mt-0.5`} />
                    <div>
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wide">{item.title}</span>
                      {item.href ? (
                        <a href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined} className="text-blue-700 font-semibold hover:underline text-[11px] flex items-center gap-1">
                          {item.value}
                          {item.external && <ExternalLink className="w-3 h-3 text-blue-400" />}
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-600">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200/70">
              <a
                href="https://www.ucl.ac.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-navy-950 hover:bg-blue-900 text-white font-bold text-xs py-3 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 btn-shimmer btn-magnetic group hover:shadow-blue-500/20 hover:shadow-lg"
              >
                <span>Visit University College London (UCL)</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-blue-400" />
              </a>
            </div>
          </div>

          {/* LOU Card */}
          <div className="reveal-on-scroll delay-100 glass-card card-gradient-reveal relative overflow-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-emerald-200/60 hover:border-emerald-300">
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-500/8 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Strategic Scholarly Publishing Partner</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 scholarly-heading tracking-tight">
                LOU Publishing and Information Services
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                NextGen Innovation &amp; Research Journals proudly collaborates with <strong className="text-slate-700">LOU Publishing and Information Services</strong> to elevate scholarly communication, bibliographic archiving, and open-science digital distribution across African and international research communities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                {[
                  { icon: MapPin, iconColor: 'text-blue-500', title: 'Regional Headquarters', value: '20 Nnamdi Crescent Street Asaba, Delta State, Nigeria', hover: 'hover:border-blue-300' },
                  { icon: Phone, iconColor: 'text-emerald-500', title: 'Direct Telephone', value: '+234 8055821283', href: 'tel:+2348055821283', hover: 'hover:border-emerald-300' },
                  { icon: Mail, iconColor: 'text-rose-500', title: 'Official Email', value: 'loupublishinginfo@gmail.com', href: 'mailto:loupublishinginfo@gmail.com', hover: 'hover:border-rose-300' },
                  { icon: Globe, iconColor: 'text-indigo-500', title: 'Publishing Web Portal', value: 'loupublishing.onrender.com', href: 'https://loupublishing.onrender.com', external: true, hover: 'hover:border-indigo-300' },
                ].map((item) => (
                  <div key={item.title} className={`flex items-start gap-2.5 p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-xs ${item.hover} transition-all duration-250 hover:shadow-sm`}>
                    <item.icon className={`w-4 h-4 ${item.iconColor} shrink-0 mt-0.5`} />
                    <div>
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wide">{item.title}</span>
                      {item.href ? (
                        <a href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined} className="text-blue-700 font-semibold hover:underline text-[11px] flex items-center gap-1">
                          {item.value}
                          {item.external && <ExternalLink className="w-3 h-3 text-blue-400" />}
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-600">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200/70">
              <a
                href="https://loupublishing.onrender.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-navy-950 hover:bg-emerald-900 text-white font-bold text-xs py-3 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 btn-shimmer btn-magnetic group hover:shadow-emerald-500/20 hover:shadow-lg"
              >
                <span>Visit LOU Publishing and Information Services</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-emerald-400" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Author CTA ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="reveal-on-scroll relative overflow-hidden bg-gradient-to-r from-navy-950 via-navy-900 to-blue-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-navy-800 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Orb decoration */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/12 rounded-full blur-3xl pointer-events-none animate-orb-slow" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-orb" />

          <div className="relative z-10 space-y-3 max-w-2xl">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Call for Submissions</span>
            <h2 className="text-2xl sm:text-3xl font-bold scholarly-heading">
              Publish Your Next Breakthrough with NextGen Innovation &amp; Research Journals
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              Experience a streamlined, respectful editorial process. Authors retain full copyright under Creative Commons Attribution licenses, with rapid desk screening, rigorous double-anonymous peer review, and automated Crossref DOI registration upon acceptance.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-md btn-shimmer btn-magnetic transition-all flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit Manuscript (DOC/DOCX)</span>
            </Link>
            <Link
              href="/editorial-policies"
              className="border border-slate-600/80 hover:border-slate-300 hover:bg-white/8 text-slate-200 text-sm px-5 py-3.5 rounded-xl font-medium transition-all text-center btn-magnetic"
            >
              Submission Guidelines
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
