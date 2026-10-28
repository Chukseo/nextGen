'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Download,
  Share2,
  Quote,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  BookOpen,
  FileText,
  CheckCircle,
  Eye,
  ArrowLeft,
  Globe,
  ChevronDown,
  X
} from 'lucide-react';
import CitationModal from '@/components/CitationModal';
import { parseCountryViews, getCountryFromTimezone, CountryViewStat } from '@/lib/geo';

export default function ArticleDetailClient({
  article,
  manuscriptBlocks,
}: {
  article: any;
  manuscriptBlocks?: any[] | null;
}) {
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [downloadsCount, setDownloadsCount] = useState<number>(article.downloadsCount || 0);
  const [viewsCount, setViewsCount] = useState<number>(article.viewsCount || 0);
  const [countryStats, setCountryStats] = useState<CountryViewStat[]>(() =>
    parseCountryViews(article.countryViews, article.viewsCount)
  );
  const [showViewsPopover, setShowViewsPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Record article view with real client geolocation / timezone
    let isMounted = true;
    const recordView = async () => {
      try {
        let countryCode: string | undefined;
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          countryCode = getCountryFromTimezone(tz) || undefined;
        } catch {}

        const res = await fetch(`/api/articles/${article.id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countryCode }),
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          if (typeof data.viewsCount === 'number') {
            setViewsCount(data.viewsCount);
          }
          if (Array.isArray(data.countryBreakdown)) {
            setCountryStats(data.countryBreakdown);
          }
        }
      } catch (err) {
        console.warn('Article view recording notice:', err);
      }
    };

    recordView();

    return () => {
      isMounted = false;
    };
  }, [article.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowViewsPopover(false);
      }
    };
    if (showViewsPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showViewsPopover]);

  const publicationYear = new Date(article.publishedAt).getFullYear();
  const rawAuthors = article.submission?.coAuthors || [];
  const leadAuthor = article.submission?.author;
  const authors = rawAuthors.length > 0
    ? rawAuthors
    : leadAuthor
    ? [
        {
          id: leadAuthor.id || 'lead',
          firstName: leadAuthor.name?.split(' ')[0] || 'Lead',
          lastName: leadAuthor.name?.split(' ').slice(1).join(' ') || 'Author',
          affiliation: leadAuthor.affiliation || 'Academic Research Institution',
          isCorresponding: true,
        },
      ]
    : [];

  const activeDoi = article.zenodoDoi || (article.doi && !article.doi.startsWith('10.5555') ? article.doi : null);

  const citationData = {
    title: article.title,
    journalTitle: article.journal.title,
    volumeNumber: article.issue?.volume?.volumeNumber,
    issueNumber: article.issue?.issueNumber,
    year: publicationYear,
    pages: article.pageRange,
    doi: activeDoi,
    authors: authors.map((a: any) => ({ firstName: a.firstName, lastName: a.lastName })),
  };

  const downloadUrl = `/articles/${article.slug || article.id}/pdf`;

  const handleDownloadClick = () => {
    setDownloadsCount((prev) => prev + 1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-10">
      {/* Back Link & Journal Banner */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          {article.journal?.coverImageUrl && (
            <Link href={`/journals/${article.journal.slug}`} className="flex-shrink-0">
              <div className="w-12 h-16 rounded overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                <img
                  src={article.journal.coverImageUrl}
                  alt={article.journal.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          )}
          <Link
            href={`/journals/${article.journal.slug}`}
            className="hover:text-blue-700 flex items-center space-x-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{article.journal.title}</span>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <span>Vol. {article.issue?.volume?.volumeNumber || 1}, No. {article.issue?.issueNumber || 1} ({publicationYear})</span>
          <span>•</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
            Open Access
          </span>
        </div>
      </div>

      {/* Main Article Header */}
      <div className="space-y-6">
        <div className="space-y-3">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            {article.submission.articleType.replace('_', ' ')}
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-navy-950 scholarly-heading leading-tight">
            {article.title}
          </h1>
          {article.submission.subtitle && (
            <p className="text-base sm:text-lg text-slate-600 font-light italic">
              {article.submission.subtitle}
            </p>
          )}
        </div>

        {/* Authors and Affiliations */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-800">
            {authors.map((author: any, idx: number) => (
              <span key={author.id} className="inline-flex items-center">
                <Link href={`/authors/${author.id}`} className="hover:text-blue-700 hover:underline">
                  {author.firstName} {author.lastName}
                </Link>
                <sup className="text-blue-700 ml-0.5 font-bold">{idx + 1}</sup>
                {author.isCorresponding && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1 ml-1 rounded">
                    Corresponding
                  </span>
                )}
                {author.orcid && (
                  <a
                    href={`https://orcid.org/${author.orcid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 text-[#a6ce39] hover:opacity-80"
                    title={`ORCID: ${author.orcid}`}
                  >
                    iD
                  </a>
                )}
                {idx < authors.length - 1 && <span className="text-slate-400 ml-2">,</span>}
              </span>
            ))}
          </div>

          <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
            {authors.map((author: any, idx: number) => (
              <div key={author.id} className="flex items-start space-x-2">
                <sup className="font-bold text-blue-700">{idx + 1}</sup>
                <span>{author.affiliation}{author.country ? `, ${author.country}` : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Persistent Identifiers & Metrics Bar */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            {activeDoi && (
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">DOI:</span>
                <a
                  href={`https://doi.org/${activeDoi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-blue-700 hover:underline flex items-center space-x-1"
                >
                  <span>https://doi.org/{activeDoi}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  {article.zenodoDoi ? 'Zenodo' : article.doiStatus}
                </span>
                {article.zenodoUrl && (
                  <a
                    href={article.zenodoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-500 hover:text-blue-700 underline flex items-center space-x-0.5 ml-1"
                  >
                    <span>Zenodo Record</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            )}
            <div className="text-slate-500 flex flex-wrap items-center gap-3">
              <span>Published: {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span>Peer-Reviewed</span>
              <span>•</span>
              <span className="inline-flex items-center space-x-1.5 font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>{downloadsCount} {downloadsCount === 1 ? 'Download' : 'Downloads'}</span>
              </span>
              {/* Interactive View Count with Country Readership Popover */}
              <div
                className="relative inline-block"
                ref={popoverRef}
                onMouseEnter={() => setShowViewsPopover(true)}
                onMouseLeave={() => setShowViewsPopover(false)}
              >
                <button
                  type="button"
                  onClick={() => setShowViewsPopover(!showViewsPopover)}
                  className="inline-flex items-center space-x-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-700 hover:border-blue-300 px-2 py-0.5 rounded border border-slate-200 transition-colors shadow-xs cursor-pointer group"
                  title="Hover or click to view reader country breakdown"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>{viewsCount} {viewsCount === 1 ? 'View' : 'Views'}</span>
                  {countryStats.length > 0 && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1.5 py-0.2 rounded ml-1">
                      {countryStats.length} {countryStats.length === 1 ? 'country' : 'countries'}
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-transform ${showViewsPopover ? 'rotate-180' : ''}`} />
                </button>

                {/* Country Analytics Popover */}
                {showViewsPopover && (
                  <div
                    className="absolute left-0 bottom-full mb-2 z-50 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 space-y-3 animation-fade-in"
                  >
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-navy-950 scholarly-heading">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span>Global Readership by Country</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {viewsCount} total {viewsCount === 1 ? 'view' : 'views'} recorded globally
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowViewsPopover(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                        title="Close"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {countryStats.length > 0 ? (
                      <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-50">
                        {countryStats.map((stat) => (
                          <div key={stat.code} className="pt-2 first:pt-0 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="inline-flex items-center space-x-2 font-medium text-slate-800 truncate">
                                <span className="text-base flex-shrink-0 leading-none">{stat.flag}</span>
                                <span className="truncate">{stat.country}</span>
                              </span>
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] flex-shrink-0 ml-2">
                                {stat.count} {stat.count === 1 ? 'view' : 'views'}
                              </span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(stat.percentage, 4)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
                        Readership country analytics will update as readers view this publication globally.
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Live Reader Analytics</span>
                      </span>
                      <span>IP Geolocation</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCitationModalOpen(true)}
              className="inline-flex items-center space-x-1.5 py-2 px-3.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-md font-semibold text-slate-700 shadow-sm transition-colors"
            >
              <Quote className="w-4 h-4 text-blue-700" />
              <span>Cite</span>
            </button>

            <a
              href={downloadUrl}
              download
              onClick={handleDownloadClick}
              className="inline-flex items-center space-x-1.5 py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>
      </div>

      {/* Abstract Section */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-navy-950 scholarly-heading border-b border-slate-100 pb-2">
          Abstract
        </h2>
        <div className="text-sm text-slate-800 leading-relaxed scholarly-abstract text-justify">
          {article.abstract}
        </div>

        {article.keywords && article.keywords.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase mr-2">Keywords:</span>
            <div className="inline-flex flex-wrap gap-1.5">
              {article.keywords.map((k: any) => (
                <span
                  key={k.id}
                  className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded font-medium"
                >
                  {k.keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bibliographic References Section (Standard Scholarly Citation Format) */}
      {article.references && article.references.length > 0 && (
        <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-navy-950 scholarly-heading">
              References ({article.references.length})
            </h2>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded">
              Verified Bibliographic Citations
            </span>
          </div>
          <ol className="list-decimal pl-5 space-y-3.5 text-xs text-slate-800 leading-relaxed font-serif">
            {article.references.map((ref: any, idx: number) => (
              <li key={ref.id || idx} className="pl-1 text-justify">
                <span className="text-slate-800">{ref.rawText}</span>
                {ref.doi && (
                  <span className="block mt-1 font-sans">
                    <a
                      href={`https://doi.org/${ref.doi.replace(/^https?:\/\/doi\.org\//, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-[11px] inline-flex items-center space-x-1"
                    >
                      <span>https://doi.org/{ref.doi.replace(/^https?:\/\/doi\.org\//, '')}</span>
                      <ExternalLink className="w-3 h-3 inline ml-0.5" />
                    </a>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Declarations & Ethics Statement */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700">
        <h2 className="text-base font-bold text-navy-950 scholarly-heading border-b border-slate-100 pb-2">
          Declarations & Editorial Statements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Conflict of Interest</h4>
            <p className="text-slate-600">{article.submission.conflictOfInterest || 'The authors declare no competing financial or non-financial interests.'}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Funding Information</h4>
            <p className="text-slate-600">{article.submission.fundingInfo || 'No external research grant was declared for this project.'}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Data Availability Statement</h4>
            <p className="text-slate-600">{article.submission.dataAvailability || 'Data sharing is not applicable or research artifacts are publicly archived as cited in the text.'}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Publishing License</h4>
            <p className="text-slate-600">
              Published under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="text-blue-700 underline font-semibold">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>. Authors retain copyright.
            </p>
          </div>
        </div>
      </section>

      {/* Citation Modal */}
      {citationModalOpen && (
        <CitationModal
          data={citationData}
          onClose={() => setCitationModalOpen(false)}
        />
      )}
    </div>
  );
}
