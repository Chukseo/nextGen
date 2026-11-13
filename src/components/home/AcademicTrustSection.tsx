'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, ExternalLink, Clock, AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM DATA CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformStatus = 'active' | 'scholar-ready' | 'submitted' | 'planned';

export interface IndexingPlatform {
  id: string;
  name: string;
  description: string;
  status: PlatformStatus;
  statusLabel: string;
  url: string;
  logo: React.ReactNode;
  featured: boolean;
}

const GoogleScholarLogo = () => (
  <img
    src="/logos/google-scholar.png"
    alt="Google Scholar"
    className="h-10 sm:h-11 w-auto max-w-full object-contain select-none"
  />
);

const ZenodoLogo = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Zenodo" role="img" className="w-14 h-14">
    <rect width="120" height="120" rx="20" fill="#1A1A2E"/>
    <path d="M22 30h76l-56 60h56" stroke="#1EAAF1" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="60" cy="112" r="5" fill="#1EAAF1"/>
  </svg>
);

const OpenAIRELogo = () => (
  <img
    src="/logos/openaire.png"
    alt="OpenAIRE"
    className="h-10 sm:h-11 w-auto max-w-full object-contain select-none"
  />
);

const DOAJLogo = () => (
  <img
    src="/logos/doaj.png"
    alt="DOAJ — Directory of Open Access Journals"
    className="h-9 sm:h-10 w-auto max-w-full object-contain rounded-md shadow-xs select-none"
  />
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
];

const TRUST_BADGES = [
  { label: 'UCL Affiliated Institution' },
  { label: 'LOU Publishing Partner' },
  { label: 'DOI Enabled' },
  { label: 'Open Access' },
  { label: 'Long-Term Preservation' },
  { label: 'Structured Citation Metadata' },
  { label: 'Google Scholar Compatible' },
];

const STATUS_STYLES: Record<PlatformStatus, { pill: string; icon: React.ReactNode }> = {
  active: {
    pill: 'bg-emerald-50 text-emerald-800 border border-emerald-200/90',
    icon: <CheckCircle className="w-3 h-3 text-emerald-600" />,
  },
  'scholar-ready': {
    pill: 'bg-blue-50 text-blue-800 border border-blue-200/90',
    icon: <CheckCircle className="w-3 h-3 text-blue-600" />,
  },
  submitted: {
    pill: 'bg-amber-50 text-amber-800 border border-amber-200/90',
    icon: <Clock className="w-3 h-3 text-amber-600" />,
  },
  planned: {
    pill: 'bg-slate-50 text-slate-600 border border-slate-200/90',
    icon: <AlertCircle className="w-3 h-3 text-slate-400" />,
  },
};

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
        group relative glass-card card-gradient-reveal rounded-2xl
        p-6 flex flex-col items-center text-center gap-4
        transition-all duration-400 ease-out
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100
      `}
    >
      {/* Logo container */}
      <div className="w-full max-w-[150px] h-20 px-3 flex items-center justify-center rounded-xl bg-white/70 border border-slate-100/90 shadow-2xs transition-transform duration-300 group-hover:scale-105 motion-reduce:scale-100">
        {platform.logo}
      </div>

      {/* Platform name */}
      <div className="space-y-1.5">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-blue-700 transition-colors duration-200">
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
      <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 motion-reduce:hidden">
        <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
      </div>
    </div>
  );
}

export default function AcademicTrustSection() {
  const headerFade = useFadeUp(0);
  const badgesFade = useFadeUp(200);

  const featuredPlatforms = INDEXING_PLATFORMS.filter((p) => p.featured);

  return (
    <section
      aria-labelledby="trust-section-heading"
      className="relative bg-gradient-to-b from-slate-50/70 via-white/80 to-slate-50/50 border-y border-slate-200/70 py-16 sm:py-20 px-4 sm:px-8 overflow-hidden"
    >
      {/* Decorative background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl animate-orb" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl animate-orb-slow" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">

        {/* Section header */}
        <div
          ref={headerFade.ref}
          className={`text-center space-y-3 max-w-2xl mx-auto transition-all duration-600 ease-out
            ${headerFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
            motion-reduce:opacity-100 motion-reduce:translate-y-0`}
        >
          <div className="inline-flex items-center space-x-2 bg-blue-50/90 border border-blue-200/80 rounded-full px-3.5 py-1 text-xs font-bold text-blue-700 uppercase tracking-wider backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Academic Indexing &amp; Preservation</span>
          </div>

          <h2
            id="trust-section-heading"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 scholarly-heading tracking-tight"
          >
            Trusted Academic Indexing &amp; Preservation
          </h2>

          <p className="text-sm text-slate-500 leading-relaxed font-light">
            NextGen journals are built for long-term preservation, scholarly discoverability,
            citation tracking, and global academic visibility.
          </p>
        </div>

        {/* Platform card grid */}
        <div
          role="list"
          aria-label="Academic indexing and archiving platforms"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {featuredPlatforms.map((platform, i) => (
            <div key={platform.id} role="listitem">
              <PlatformCard platform={platform} delay={i * 90} />
            </div>
          ))}
        </div>

        {/* Trust badges row */}
        <div
          ref={badgesFade.ref}
          className={`flex flex-wrap justify-center gap-2.5 pt-2 transition-all duration-500 ease-out
            ${badgesFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            motion-reduce:opacity-100 motion-reduce:translate-y-0`}
        >
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-emerald-300 hover:text-emerald-800 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 cursor-default"
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
