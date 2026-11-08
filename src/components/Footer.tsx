import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Globe, Award, Mail, GraduationCap, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 pt-16 pb-12 border-t border-navy-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-navy-800">
          {/* Col 1: Publisher Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1 rounded-lg shadow-sm">
                <img
                  src="/logo.png"
                  alt="NextGen Innovation & Research Journals Logo"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-white text-base scholarly-heading block">
                  NextGen Innovation & Research Journals
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                  Scholarly Publishing
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              NextGen Innovation & Research Journals is a digital scholarly publisher committed to rigorous peer review, open access dissemination, and persistent scholarly infrastructure.
            </p>

            {/* Research Partnership with University College London Highlight */}
            <div className="p-3 rounded-xl bg-navy-900/90 border border-navy-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Research Partnership</span>
              </div>
              <p className="text-xs text-slate-200 font-semibold leading-snug">
                University College London (UCL)
              </p>
              <p className="text-[11px] text-slate-400">
                Gower Street, London, United Kingdom
              </p>
            </div>

            <div className="pt-1 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Gower Street, London, United Kingdom</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>nextgenjournals@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Col 2: Journals & Archives */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Journals & Library</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/journals/jstai" className="hover:text-white transition-colors">Journal of Science, Technology & AI</Link></li>
              <li><Link href="/journals/necr" className="hover:text-white transition-colors">NextGen Engineering & Computing Review</Link></li>
              <li><Link href="/journals/ihls" className="hover:text-white transition-colors">Interdisciplinary Health & Life Sciences</Link></li>
              <li><Link href="/journals" className="hover:text-white transition-colors">All Journals & Archives</Link></li>
              <li><Link href="/articles" className="hover:text-white transition-colors">Browse Published Articles</Link></li>
            </ul>
          </div>

          {/* Col 3: Editorial Guidelines */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Editorial & Policies</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/submit" className="hover:text-white transition-colors">Author Submission Guidelines</Link></li>
              <li><Link href="/editorial-policies" className="hover:text-white transition-colors">Peer Review Process</Link></li>
              <li><Link href="/editorial-policies" className="hover:text-white transition-colors">COPE Publication Ethics</Link></li>
              <li><Link href="/editorial-policies" className="hover:text-white transition-colors">Open Access & CC BY 4.0 License</Link></li>
              <li><Link href="/editorial-policies" className="hover:text-white transition-colors">Plagiarism & Retraction Policy</Link></li>
            </ul>
          </div>

          {/* Col 4: Scholarly Standards & Indexing */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Scholarly Standards</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each journal under NextGen is governed by an independent Editor-in-Chief across different Universities in the world and an international editorial board of recognized scholars. Editorial decisions are made strictly on scholarly merits, technical rigour and methodological soundness, free from commercial or political influence.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-navy-900 border border-navy-800 rounded p-2 text-center">
                <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-wider">Crossref</span>
                <span className="text-[11px] text-slate-300">Registered DOIs</span>
              </div>
              <div className="bg-navy-900 border border-navy-800 rounded p-2 text-center">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">CC BY 4.0</span>
                <span className="text-[11px] text-slate-300">Open Access</span>
              </div>
              <div className="bg-navy-900 border border-navy-800 rounded p-2 text-center">
                <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">COPE</span>
                <span className="text-[11px] text-slate-300">Ethics Compliant</span>
              </div>
              <div className="bg-navy-900 border border-navy-800 rounded p-2 text-center">
                <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider">Peer-Reviewed</span>
                <span className="text-[11px] text-slate-300">Scholarly Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Research Partnership with University College London Banner */}
        <div className="my-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-900/95 to-blue-950/70 border border-navy-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Academic &amp; Research Partnership</span>
                <span className="text-slate-600 text-xs hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">Global Scholarly Dissemination</span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                University College London (UCL) &bull; Gower Street, London, United Kingdom
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-300 md:text-right max-w-md">
            Advancing open-access scientific discovery, peer-reviewed computing benchmarks, and multidisciplinary research excellence.
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
          <div>
            © {new Date().getFullYear()} NextGen Innovation &amp; Research Journals. In research partnership with University College London. Gower Street, London, United Kingdom. CC BY 4.0.
          </div>
          <div className="flex space-x-6">
            <Link href="/about" className="hover:text-slate-400">About the Organization</Link>
            <Link href="/editorial-policies" className="hover:text-slate-400">Privacy & Terms</Link>
            <Link href="/contact" className="hover:text-slate-400">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
