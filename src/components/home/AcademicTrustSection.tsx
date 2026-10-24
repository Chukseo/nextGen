'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, ExternalLink, Clock, AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM DATA CONFIGURATION
// Add/remove platforms here without touching component logic.
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformStatus = 'active' | 'scholar-ready' | 'submitted' | 'planned';

export interface IndexingPlatform {
  id: string;
  name: string;
  description: string;
  status: PlatformStatus;
  statusLabel: string;
  url: string;
  /** SVG string rendered inline — keeps bundle clean, no external img requests */
  logo: React.ReactNode;
  /** Whether to show this platform in the main grid */
  featured: boolean;
}

// Inline SVG logos — copyright-safe interpretations using official brand colours.
const GoogleScholarLogo = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Google Scholar" role="img" className="w-16 h-16">
    <rect width="120" height="120" rx="20" fill="#f8f9fa"/>
    {/* Mortarboard cap */}
    <polygon points="60,22 100,42 60,58 20,42" fill="#4285F4"/>
    <polygon points="20,42 60,58 60,78 20,62" fill="#3367D6"/>
    <polygon points="100,42 60,58 60,78 100,62" fill="#5B9BF5"/>
    {/* Scholar "S" */}
    <text x="60" y="108" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily="serif" fill="#4285F4">Scholar</text>
  </svg>
);

const ZenodoLogo = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Zenodo" role="img" className="w-16 h-16">
    <rect width="120" height="120" rx="20" fill="#1A1A2E"/>
    {/* Z lettermark */}
    <path d="M22 30h76l-56 60h56" stroke="#1EAAF1" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    {/* DOT */}
    <circle cx="60" cy="112" r="5" fill="#1EAAF1"/>
  </svg>
);

const OpenAIRELogo = () => (
  <img
    src="/logos/openaire.png"
    alt="OpenAIRE"
    className="h-11 sm:h-12 w-auto max-w-full object-contain select-none"
  />
);

const DOAJLogo = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="DOAJ – Directory of Open Access Journals" role="img" className="w-16 h-16">
    <rect width="120" height="120" rx="20" fill="#ffffff"/>
    <rect x="2" y="2" width="116" height="116" rx="18" stroke="#E8F5E9" strokeWidth="2"/>
    {/* Open lock / access icon */}
    <rect x="30" y="54" width="60" height="42" rx="8" fill="#2E7D32"/>
    <path d="M42 54V42a18 18 0 1 1 36 0" stroke="#2E7D32" strokeWidth="7" strokeLinecap="round" fill="none"/>
    <circle cx="60" cy="72" r="7" fill="#ffffff"/>
    <rect x="57" y="72" width="6" height="12" rx="3" fill="#ffffff"/>
    {/* DOAJ wordmark */}
    <text x="60" y="115" textAnchor="middle" fontSize="13" fontWeight="800" fontFamily="sans-serif" fill="#2E7D32">DOAJ</text>
  </svg>
);

// Planned / pipeline platforms (shown in secondary row when featured: false)
const CrossrefLogo = () => (
  <svg viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Crossref" role="img" className="h-8 w-auto">
    <text x="0" y="30" fontSize="26" fontWeight="800" fontFamily="sans-serif" fill="#E77B24">Cross</text>
    <text x="56" y="30" fontSize="26" fontWeight="800" fontFamily="sans-serif" fill="#E05C1A">ref</text>
  </svg>
);

export const INDEXING_PLATFORMS: IndexingPlatform[] = [
  {
    id: 'google-scholar',
    name: 'Google Scholar',
    description: 'Scholar-ready metadata and structured citation discovery.',
    status: 'scholar-ready',
    statusLabel: 'Scholar Ready',
    url: 'https://scholar.google.com',
    logo: <GoogleScholarLogo />,
    featured: true,
  },
  {
    id: 'zenodo',
    name: 'Zenodo',
    description: 'Permanent open-access archiving with DOI infrastructure by CERN.',
    status: 'active',
    statusLabel: 'Active',
    url: 'https://zenodo.org/communities/nextgenjournals',
    logo: <ZenodoLogo />,
    featured: true,
  },
  {
    id: 'openaire',
    name: 'OpenAIRE',
    description: 'Global open-science discovery network and EU research aggregation.',
    status: 'active',
    statusLabel: 'Active',
    url: 'https://explore.openaire.eu',
    logo: <OpenAIRELogo />,
    featured: true,
  },
  {
    id: 'doaj',
    name: 'DOAJ',
    description: 'Directory of Open Access Journals — application submitted for review.',
    status: 'submitted',
    statusLabel: 'Application Submitted',
    url: 'https://doaj.org',
    logo: <DOAJLogo />,
    featured: true,
  },
  // Pipeline platforms (not rendered in main grid, but available for future use)
  {
    id: 'crossref',
    name: 'Crossref',
    description: 'DOI registration and scholarly metadata infrastructure.',
    status: 'active',
    statusLabel: 'Active',
    url: 'https://crossref.org',
    logo: <CrossrefLogo />,
    featured: false,
  },
  {
    id: 'openalex',
    name: 'OpenAlex',
    description: 'Open scholarly knowledge graph for global research discovery.',
    status: 'planned',
    statusLabel: 'Planned',
    url: 'https://openalex.org',
    logo: null,
    featured: false,
  },
  {
    id: 'base',
    name: 'BASE',
    description: 'Bielefeld Academic Search Engine for open-access resources.',
    status: 'planned',
    statusLabel: 'Planned',
    url: 'https://base-search.net',
    logo: null,
    featured: false,
  },
  {
    id: 'road',
    name: 'ROAD',
    description: 'ISSN International Centre directory of open access resources.',
    status: 'planned',
    statusLabel: 'Planned',
    url: 'https://road.issn.org',
    logo: null,
    featured: false,
  },
  {
    id: 'scopus',
    name: 'Scopus',
    description: 'Elsevier Scopus abstract and citation database.',
    status: 'planned',
    statusLabel: 'Planned',
    url: 'https://scopus.com',
    logo: null,
    featured: false,
  },
  {
    id: 'dimensions',
    name: 'Dimensions',
    description: 'Digital Science linked research data and analytics platform.',
    status: 'planned',
    statusLabel: 'Planned',
    url: 'https://dimensions.ai',
    logo: null,
    featured: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Trust badges row
// ─────────────────────────────────────────────────────────────────────────────

const TRUST_BADGES = [
  { label: 'DOI Enabled' },
  { label: 'Open Access' },
  { label: 'Long-Term Preservation' },
  { label: 'Structured Citation Metadata' },
  { label: 'Google Scholar Compatible' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Status pill helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PlatformStatus, { pill: string; icon: React.ReactNode }> = {
  active: {
    pill: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    icon: <CheckCircle className="w-3 h-3 text-emerald-600" />,
  },
  'scholar-ready': {
    pill: 'bg-blue-50 text-blue-800 border border-blue-200',
    icon: <CheckCircle className="w-3 h-3 text-blue-600" />,
  },
  submitted: {
    pill: 'bg-amber-50 text-amber-800 border border-amber-200',
    icon: <Clock className="w-3 h-3 text-amber-600" />,
  },
  planned: {
    pill: 'bg-slate-50 text-slate-600 border border-slate-200',
    icon: <AlertCircle className="w-3 h-3 text-slate-400" />,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Intersection-observer hook for fade-up animation
// ─────────────────────────────────────────────────────────────────────────────

function useFadeUp(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return { ref, visible };
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform card
// ─────────────────────────────────────────────────────────────────────────────

function PlatformCard({
  platform,
  delay,
}: {
  platform: IndexingPlatform;
  delay: number;
}) {
  const { ref, visible } = useFadeUp(delay);
  const statusStyle = STATUS_STYLES[platform.status];

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: '500ms',
      }}
      className={`
        group relative bg-white rounded-2xl border border-slate-200 shadow-sm
        p-6 flex flex-col items-center text-center gap-4
        transition-all duration-500 ease-out
        hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-200
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100
      `}
    >
      {/* Logo container */}
      <div className="w-full max-w-[150px] h-20 px-3 flex items-center justify-center rounded-xl bg-slate-50/80 border border-slate-100 transition-transform duration-300 group-hover:scale-105 motion-reduce:scale-100">
        {platform.logo}
      </div>

      {/* Platform name */}
      <div className="space-y-1.5">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight">
          {platform.name}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {platform.description}
        </p>
      </div>

      {/* Status pill */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyle.pill}`}>
        {statusStyle.icon}
        <span>{platform.statusLabel}</span>
      </div>

      {/* External link */}
      <a
        href={platform.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${platform.name} (opens in new tab)`}
        className="absolute inset-0 rounded-2xl focus:outline-none"
        tabIndex={0}
      >
        <span className="sr-only">Visit {platform.name}</span>
      </a>

      {/* Hover arrow overlay */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 motion-reduce:hidden">
        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function AcademicTrustSection() {
  const headerFade = useFadeUp(0);
  const badgesFade = useFadeUp(200);

  const featuredPlatforms = INDEXING_PLATFORMS.filter((p) => p.featured);

  return (
    <section
      aria-labelledby="trust-section-heading"
      className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50/60 border-y border-slate-200 py-16 sm:py-20 px-4 sm:px-8 overflow-hidden"
    >
      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl" />
        {/* Subtle dot-grid pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.025]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#334155" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">

        {/* Section header */}
        <div
          ref={headerFade.ref}
          className={`text-center space-y-3 max-w-2xl mx-auto transition-all duration-600 ease-out
            ${headerFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
            motion-reduce:opacity-100 motion-reduce:translate-y-0`}
        >
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Academic Indexing &amp; Preservation</span>
          </div>

          <h2
            id="trust-section-heading"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 scholarly-heading tracking-tight"
          >
            Trusted Academic Indexing &amp; Preservation
          </h2>

          <p className="text-sm text-slate-500 leading-relaxed">
            NextGen journals are built for long-term preservation, scholarly discoverability,
            citation tracking, and global academic visibility.
          </p>
        </div>

        {/* Platform card grid: 4-col desktop / 2-col tablet / 1-col mobile */}
        <div
          role="list"
          aria-label="Academic indexing and archiving platforms"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {featuredPlatforms.map((platform, i) => (
            <div key={platform.id} role="listitem">
              <PlatformCard platform={platform} delay={i * 100} />
            </div>
          ))}
        </div>

        {/* Trust badges row */}
        <div
          ref={badgesFade.ref}
          className={`flex flex-wrap justify-center gap-3 pt-2 transition-all duration-500 ease-out
            ${badgesFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            motion-reduce:opacity-100 motion-reduce:translate-y-0`}
        >
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:border-emerald-300 hover:text-emerald-800 transition-colors duration-200"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Compliance disclaimer */}
        <p className="text-center text-[11px] text-slate-400 leading-relaxed max-w-xl mx-auto">
          Indexing statuses reflect verified integrations. &ldquo;Application Submitted&rdquo; indicates an active
          application under review. Platform logos remain the property of their respective organisations.
        </p>
      </div>
    </section>
  );
}
