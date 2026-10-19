import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Globe, Award, Mail } from 'lucide-react';

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
                  alt="NextGen Press Logo"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-white text-base scholarly-heading block">
                  NextGen Press
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                  Scholarly Publishing
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              NextGen Innovation & Research Journals is an independent digital scholarly publisher committed to high-standard peer review, open access dissemination, and persistent scholarly infrastructure.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>nextgenjournals@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>London, UK</span>
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
              All articles are assigned persistent Digital Object Identifiers (DOIs) registered with Crossref and indexed for long-term digital preservation.
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

        {/* Bottom Legal bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
          <div>
            © {new Date().getFullYear()} NextGen Innovation & Research Journals. All rights reserved. Content published under Creative Commons Attribution 4.0 International.
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
