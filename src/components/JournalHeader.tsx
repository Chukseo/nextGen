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

  // Close dropdown on click outside
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
    <div className="bg-navy-950 text-white border-b border-navy-900 shadow-md">
      {/* Journal Masthead */}
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded">
              {journal.slug.toUpperCase()}
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {journal.abbreviation}
            </span>
            <span className="text-xs text-emerald-300 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded font-medium">
              Open Access (CC BY 4.0)
            </span>
            <button
              onClick={() => setImpactModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-xs group"
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

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span><strong>Print ISSN:</strong> {journal.printIssn || 'N/A'}</span>
            <span>•</span>
            <span><strong>Online ISSN:</strong> {journal.onlineIssn || 'N/A'}</span>
          </div>
        </div>

        {journal.coverImageUrl && (
          <div className="flex-shrink-0 w-36 sm:w-44 md:w-48 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-navy-900 group">
            <img
              src={journal.coverImageUrl}
              alt={`${journal.title} cover`}
              className="w-full h-auto aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </div>

      {/* Journal Subnav Menu Bar */}
      <div className="border-t border-navy-800 bg-navy-900/90 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <nav className="flex items-center space-x-1 sm:space-x-3 overflow-visible py-1" aria-label="Journal Sections">
            
            {/* About Dropdown Menu */}
            <div
              ref={dropdownRef}
              className="relative inline-block text-left"
              onMouseEnter={() => setAboutDropdownOpen(true)}
              onMouseLeave={() => setAboutDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
                className={`flex items-center space-x-1.5 px-3 py-3 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
                  isAboutActive
                    ? 'border-blue-400 text-white bg-navy-950/40'
                    : 'border-transparent text-slate-300 hover:text-white hover:border-slate-500'
                }`}
                aria-expanded={aboutDropdownOpen}
              >
                <Info className={`w-3.5 h-3.5 ${isAboutActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>About</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${aboutDropdownOpen ? 'rotate-180 text-blue-400' : 'text-slate-400'}`} />
              </button>

              {/* Dropdown Items */}
              {aboutDropdownOpen && (
                <div className="absolute left-0 top-full mt-0 w-64 rounded-xl bg-white text-slate-800 shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Journal Information & Governance
                  </div>

                  <Link
                    href={`/journals/${journal.slug}`}
                    onClick={() => setAboutDropdownOpen(false)}
                    className={`flex items-center space-x-2.5 px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
                      activeTab === 'about' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-semibold">About & Scope</div>
                      <div className="text-[10px] text-slate-500 font-normal">Journal background & research aims</div>
                    </div>
                  </Link>

                  <Link
                    href={`/journals/${journal.slug}/editorial-board`}
                    onClick={() => setAboutDropdownOpen(false)}
                    className={`flex items-center space-x-2.5 px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
                      activeTab === 'editorial-board' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Editorial Board</div>
                      <div className="text-[10px] text-slate-500 font-normal">Editor-in-Chief & board members</div>
                    </div>
                  </Link>

                  <Link
                    href={`/journals/${journal.slug}/guidelines`}
                    onClick={() => setAboutDropdownOpen(false)}
                    className={`flex items-center space-x-2.5 px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
                      activeTab === 'guidelines' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Author Guidelines</div>
                      <div className="text-[10px] text-slate-500 font-normal">Submission format & instructions</div>
                    </div>
                  </Link>

                  <Link
                    href={`/submit?journal=${journal.id}`}
                    onClick={() => setAboutDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3.5 py-2.5 text-xs hover:bg-blue-50 transition-colors text-blue-900 group"
                  >
                    <Send className="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-emerald-700">Submit Article</div>
                      <div className="text-[10px] text-slate-500 font-normal">Submit original manuscript</div>
                    </div>
                  </Link>

                  <Link
                    href={`/journals/${journal.slug}/privacy`}
                    onClick={() => setAboutDropdownOpen(false)}
                    className={`flex items-center space-x-2.5 px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
                      activeTab === 'privacy' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Privacy Statement</div>
                      <div className="text-[10px] text-slate-500 font-normal">Author data & review anonymity</div>
                    </div>
                  </Link>

                  <Link
                    href={`/journals/${journal.slug}/contact`}
                    onClick={() => setAboutDropdownOpen(false)}
                    className={`flex items-center space-x-2.5 px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
                      activeTab === 'contact' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Editorial Contact</div>
                      <div className="text-[10px] text-slate-500 font-normal">Office address & editorial inquiries</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Other Direct Nav Tabs */}
            {otherTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex items-center space-x-2 px-3 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'border-blue-400 text-white bg-navy-950/40'
                      : 'border-transparent text-slate-300 hover:text-white hover:border-slate-500'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="py-2 sm:py-0 shrink-0">
            <Link
              href={`/submit?journal=${journal.id}`}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded shadow transition-colors inline-flex items-center space-x-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Submit Manuscript</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2-Year Journal Impact Factor Report Modal */}
      <JournalImpactFactorModal
        isOpen={impactModalOpen}
        onClose={() => setImpactModalOpen(false)}
        journal={journal}
      />
    </div>
  );
}
