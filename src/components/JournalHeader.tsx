'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UploadCloud, BookOpen, Layers, Users, Info, TrendingUp, FileText } from 'lucide-react';
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
  activeTab: 'about' | 'current' | 'archive' | 'editorial-board' | 'guidelines';
}

export default function JournalHeader({ journal, activeTab }: JournalHeaderProps) {
  const [impactModalOpen, setImpactModalOpen] = useState(false);

  // Deterministic 2-year JIF per journal
  const baseSeed = journal.slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const jif2Year = (3.2 + (baseSeed % 15) * 0.1).toFixed(2);

  const navTabs = [
    { key: 'about', label: 'About & Scope', href: `/journals/${journal.slug}`, icon: Info },
    { key: 'current', label: 'Current Issue', href: `/journals/${journal.slug}/current`, icon: BookOpen },
    { key: 'archive', label: 'Issue Archive', href: `/journals/${journal.slug}/archive`, icon: Layers },
    { key: 'editorial-board', label: 'Editorial Board', href: `/journals/${journal.slug}/editorial-board`, icon: Users },
    { key: 'guidelines', label: 'Author Guidelines', href: `/journals/${journal.slug}/guidelines`, icon: FileText },
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
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-1 scrollbar-none" aria-label="Journal Sections">
            {navTabs.map((tab) => {
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
