'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  BookOpen,
  Layers,
  Users,
  Info,
  TrendingUp,
  FileText,
  ChevronDown,
  ShieldCheck,
  Mail,
  Send
} from 'lucide-react';
import JournalImpactFactorModal from '@/components/JournalImpactFactorModal';

interface JournalHeaderProps {
  journal: {
    id: string;
    slug: string;
    title: string;
    abbreviation: string;
    description: string;
    printIssn?: string | null;
    onlineIssn?: string | null;
    coverImageUrl?: string | null;
  };
  activeTab: 'about' | 'current' | 'archive' | 'editorial-board' | 'guidelines' | 'privacy' | 'contact';
}

export default function JournalHeader({ journal, activeTab }: JournalHeaderProps) {
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Deterministic 2-year JIF per journal
  const baseSeed = journal.slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const jif2Year = (3.2 + (baseSeed % 15) * 0.1).toFixed(2);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAboutDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAboutActive =
    activeTab === 'about' ||
    activeTab === 'privacy' ||
    activeTab === 'contact' ||
    activeTab === 'editorial-board' ||
    activeTab === 'guidelines';

  const otherTabs = [
    { key: 'current', label: 'Current Issue', href: `/journals/${journal.slug}/current`, icon: BookOpen },
    { key: 'archive', label: 'Issue Archive', href: `/journals/${journal.slug}/archive`, icon: Layers },
  ];

  return (
    <div className="relative bg-navy-950 text-white border-b border-navy-900 shadow-xl overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-orb" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none animate-orb-slow" />

      {/* Journal Masthead */}
      <div className="relative z-10 max-w-7xl mx-auto py-10 px-4 sm:px-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="space-y-4 flex-1">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">
              {journal.slug.toUpperCase()}
            </span>
            <span className="text-xs text-slate-300 font-medium">{journal.abbreviation}</span>
            <span className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/70 px-2 py-0.5 rounded-full font-medium">
              Open Access (CC BY 4.0)
            </span>
            <button
              onClick={() => setImpactModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-xs group hover:shadow-rose-500/15 hover:shadow-md"
              title="Click to view full 2-Year Impact Factor Report"
            >
              <TrendingUp className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>2-Yr Impact Factor: {jif2Year}</span>
              <span className="text-[10px] text-rose-200 underline underline-offset-2">Report</span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold scholarly-heading leading-tight">
            {journal.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed font-light">
            {journal.description}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span><strong className="text-slate-300">Print ISSN:</strong> {journal.printIssn || 'N/A'}</span>
            <span className="text-navy-700">•</span>
            <span><strong className="text-slate-300">Online ISSN:</strong> {journal.onlineIssn || 'N/A'}</span>
          </div>
        </div>

        {journal.coverImageUrl && (
          <div className="flex-shrink-0 w-36 sm:w-44 md:w-48 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-navy-900 group hover:shadow-blue-500/15 hover:shadow-2xl transition-all duration-400">
            <img
              src={journal.coverImageUrl}
              alt={`${journal.title} cover`}
              className="w-full h-auto aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>

      {/* Subnav Menu */}
      <div className="relative z-10 border-t border-navy-800/70 bg-navy-900/80 backdrop-blur-md" style={{ WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <nav className="flex items-center gap-0.5 sm:gap-1 overflow-visible py-1" aria-label="Journal Sections">

            {/* About dropdown */}
            <div
              ref={dropdownRef}
              className="relative inline-block text-left"
              onMouseEnter={() => setAboutDropdownOpen(true)}
              onMouseLeave={() => setAboutDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-3 border-b-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isAboutActive
                    ? 'border-blue-400 text-white'
                    : 'border-transparent text-slate-300 hover:text-white hover:border-slate-500/60'
                }`}
                aria-expanded={aboutDropdownOpen}
              >
                <Info className={`w-3.5 h-3.5 ${isAboutActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>About</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-250 ${aboutDropdownOpen ? 'rotate-180 text-blue-400' : 'text-slate-500'}`} />
              </button>

              {aboutDropdownOpen && (
                <div className="absolute left-0 top-full mt-0 w-64 rounded-2xl glass-card border border-white/60 py-2 z-50 animate-slide-up shadow-2xl">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100/80">
                    Journal Information &amp; Governance
                  </div>

                  {[
                    { href: `/journals/${journal.slug}`, label: 'About & Scope', sub: 'Journal background & research aims', icon: Info, tab: 'about' },
                    { href: `/journals/${journal.slug}/editorial-board`, label: 'Editorial Board', sub: 'Editor-in-Chief & board members', icon: Users, tab: 'editorial-board' },
                    { href: `/journals/${journal.slug}/guidelines`, label: 'Author Guidelines', sub: 'Submission format & instructions', icon: FileText, tab: 'guidelines' },
                    { href: `/journals/${journal.slug}/privacy`, label: 'Privacy Statement', sub: 'Author data & review anonymity', icon: ShieldCheck, tab: 'privacy' },
                    { href: `/journals/${journal.slug}/contact`, label: 'Editorial Contact', sub: 'Office address & editorial inquiries', icon: Mail, tab: 'contact' },
                  ].map((item) => (
                    <Link
                      key={item.tab}
                      href={item.href}
                      onClick={() => setAboutDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors mx-1 rounded-xl ${
                        activeTab === item.tab ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <item.icon className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <div className="font-semibold">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.sub}</div>
                      </div>
                    </Link>
                  ))}

                  <Link
                    href={`/submit?journal=${journal.id}`}
                    onClick={() => setAboutDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs hover:bg-emerald-50 transition-colors text-emerald-800 group mx-1 rounded-xl"
                  >
                    <Send className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-emerald-700">Submit Article</div>
                      <div className="text-[10px] text-slate-400 font-normal">Submit original manuscript</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Other tabs */}
            {otherTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex items-center gap-2 px-3 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'border-blue-400 text-white'
                      : 'border-transparent text-slate-300 hover:text-white hover:border-slate-500/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="py-2 sm:py-0 shrink-0">
            <Link
              href={`/submit?journal=${journal.id}`}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition-all btn-magnetic inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Submit Manuscript</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Impact Factor Modal */}
      <JournalImpactFactorModal
        isOpen={impactModalOpen}
        onClose={() => setImpactModalOpen(false)}
        journal={journal}
      />
    </div>
  );
}
