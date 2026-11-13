import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Globe, Award, Mail, GraduationCap, MapPin, ArrowRight, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-navy-950 text-slate-300 pt-16 pb-10 border-t border-navy-900 mt-20 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl pointer-events-none animate-orb" />
      <div className="absolute top-20 right-0 w-64 h-64 bg-indigo-600/6 rounded-full blur-3xl pointer-events-none animate-orb-slow" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-navy-700/60 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-navy-800/70">

          {/* Col 1: Publisher Identity */}
          <div className="space-y-5 md:col-span-1">
            {/* Logo + Name */}
            <div className="flex items-center gap-3 group">
              <div className="bg-white/90 p-1.5 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/logo.png"
                  alt="NextGen Innovation & Research Journals Logo"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-white text-sm scholarly-heading block leading-tight">
                  NextGen Innovation &amp; Research Journals
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-semibold mt-0.5">
                  Scholarly Publishing
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              A digital scholarly publisher committed to rigorous peer review, open access dissemination, and persistent scholarly infrastructure.
            </p>

            {/* Partnership badges */}
            <div className="space-y-2.5">
              {/* UCL */}
              <div className="group p-3 rounded-2xl bg-gradient-to-br from-navy-900/80 to-blue-950/40 border border-navy-800 hover:border-blue-700/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:bg-blue-600/30 transition-colors">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Affiliated Institution</span>
                </div>
                <p className="text-xs text-slate-200 font-semibold leading-snug">University College London (UCL)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Gower Street, London, United Kingdom</p>
              </div>

              {/* LOU */}
              <div className="group p-3 rounded-2xl bg-gradient-to-br from-navy-900/80 to-emerald-950/30 border border-navy-800 hover:border-emerald-700/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-600/30 transition-colors">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Strategic Partner</span>
                </div>
                <p className="text-xs text-slate-200 font-semibold leading-snug">LOU Publishing and Information Services</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Asaba, Delta State, Nigeria</p>
              </div>
            </div>

            {/* Contact */}
            <div className="text-xs text-slate-400 space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Gower Street, London, United Kingdom</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <a href="mailto:nextgenjournals@gmail.com" className="hover:text-blue-300 transition-colors">
                  nextgenjournals@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Journals */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white tracking-widest uppercase pb-2 border-b border-navy-800/80">
              Journals &amp; Library
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { href: '/journals/jstai', label: 'Journal of Science, Technology & AI' },
                { href: '/journals/necr', label: 'NextGen Engineering & Computing Review' },
                { href: '/journals/ihls', label: 'Interdisciplinary Health & Life Sciences' },
                { href: '/journals', label: 'All Journals & Archives' },
                { href: '/articles', label: 'Browse Published Articles' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="footer-link text-slate-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -ml-4 group-hover:ml-0 duration-200" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Editorial */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white tracking-widest uppercase pb-2 border-b border-navy-800/80">
              Editorial &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { href: '/submit', label: 'Author Submission Guidelines' },
                { href: '/editorial-policies', label: 'Peer Review Process' },
                { href: '/editorial-policies', label: 'COPE Publication Ethics' },
                { href: '/editorial-policies', label: 'Open Access & CC BY 4.0 License' },
                { href: '/editorial-policies', label: 'Plagiarism & Retraction Policy' },
              ].map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="footer-link text-slate-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -ml-4 group-hover:ml-0 duration-200" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Standards */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white tracking-widest uppercase pb-2 border-b border-navy-800/80">
              Scholarly Standards
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each journal is governed by an independent Editor-in-Chief and an international editorial board. Decisions are made strictly on scholarly merits, free from commercial influence.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: 'Crossref', sub: 'Registered DOIs', color: 'text-blue-400', hover: 'hover:border-blue-700' },
                { label: 'CC BY 4.0', sub: 'Open Access', color: 'text-emerald-400', hover: 'hover:border-emerald-700' },
                { label: 'COPE', sub: 'Ethics Compliant', color: 'text-amber-400', hover: 'hover:border-amber-700' },
                { label: 'Peer-Reviewed', sub: 'Scholarly Standard', color: 'text-indigo-400', hover: 'hover:border-indigo-700' },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className={`bg-navy-900/80 border border-navy-800 rounded-xl p-2.5 text-center cursor-default transition-all duration-250 hover:scale-[1.03] hover:shadow-[0_0_16px_rgba(255,255,255,0.04)] ${badge.hover}`}
                >
                  <span className={`text-[10px] font-bold block uppercase tracking-wider ${badge.color}`}>{badge.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{badge.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Partnership Banner */}
        <div className="my-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-900/95 to-blue-950/60 border border-navy-800 hover:border-blue-900/60 transition-all duration-400 grid grid-cols-1 md:grid-cols-2 gap-6 items-center group hover:shadow-[0_0_40px_rgba(37,99,235,0.07)]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/15 text-blue-400 border border-blue-500/25 flex items-center justify-center shrink-0 group-hover:bg-blue-600/22 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Affiliated Institution</span>
                <span className="text-slate-700 text-xs hidden sm:inline">•</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">Research Collaboration</span>
              </div>
              <p className="text-sm font-semibold text-white">
                University College London (UCL) &bull; Gower Street, London, UK
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:border-l md:border-navy-800 md:pl-6">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0 group-hover:bg-emerald-600/22 transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Publishing Partner</span>
                <span className="text-slate-700 text-xs hidden sm:inline">•</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">Bibliographic Services</span>
              </div>
              <p className="text-sm font-semibold text-white">
                LOU Publishing and Information Services &bull; Nigeria
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
          <div className="text-center md:text-left leading-relaxed">
            &copy; {new Date().getFullYear()} NextGen Innovation &amp; Research Journals.
            Affiliated with University College London (UCL) &bull; In partnership with LOU Publishing.
            Gower Street, London, United Kingdom. CC BY 4.0.
          </div>
          <div className="flex items-center gap-5 flex-shrink-0">
            <Link href="/about" className="hover:text-slate-300 transition-colors">About</Link>
            <Link href="/editorial-policies" className="hover:text-slate-300 transition-colors">Privacy &amp; Terms</Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
