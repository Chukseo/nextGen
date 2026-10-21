import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { BookOpen, Award, Shield, Globe, Users, CheckCircle } from 'lucide-react';
import { getBaseUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'About NextGen Innovation & Research Journals',
  description: 'Learn about NextGen Innovation & Research Journals, an academic scholarly publisher based in London, UK, committed to peer review integrity and open-access research.',
  alternates: {
    canonical: `${getBaseUrl()}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14 space-y-12">
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Publishing Organization</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 scholarly-heading">
          About NextGen Innovation & Research Journals
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-light">
          A dedicated digital scholarly publisher committed to high-standard peer review, transparent open access, and persistent scholarly infrastructure.
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
            Our Mission & Positioning
          </h2>
          <p>
            NextGen Innovation & Research Journals was established to address the critical need for rapid, rigorous, and completely unrestricted dissemination of advanced scientific and technical research. Specializing in computer science, artificial intelligence, cyber-physical systems, hardware architectures, and computational healthcare, the platform provides an advanced venue adhering to international editorial integrity standards.
          </p>
          <p>
            We believe scholarly knowledge is a global public good. All peer-reviewed articles published across our catalog are released under the Creative Commons Attribution 4.0 International License (CC BY 4.0), ensuring universal accessibility without subscription walls or reading barriers.
          </p>
        </section>

        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 scholarly-heading flex items-center space-x-2">
            <Award className="w-5 h-5 text-blue-700" />
            <span>Persistent Scholarly Infrastructure</span>
          </h3>
          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Crossref Member:</strong> Every accepted paper is assigned a permanent Digital Object Identifier (DOI) and deposited with structured schema metadata for worldwide bibliographic discovery.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Committee on Publication Ethics (COPE):</strong> Our editorial workflows adhere strictly to the COPE Code of Conduct for Journal Editors.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Permanent Archiving:</strong> Articles are preserved across digital repositories ensuring permanent post-publication availability.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
            Editorial Independence & Governance
          </h2>
          <p>
            Each journal under NextGen Innovation & Research Journals is governed by an independent Editor-in-Chief and an international editorial board of recognized scholars. Editorial decisions are made strictly on scholarly merits, technical rigour, and methodological soundness, free from commercial or political influence.
          </p>
        </section>

        <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs">
          <Link href="/journals" className="text-blue-700 font-semibold hover:underline">
            Explore Journal Catalog
          </Link>
          <Link href="/editorial-policies" className="text-blue-700 font-semibold hover:underline">
            Review Publication Ethics
          </Link>
        </div>
      </div>
    </div>
  );
}
