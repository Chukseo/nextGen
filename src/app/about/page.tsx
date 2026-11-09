import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { BookOpen, Award, Shield, Globe, Users, CheckCircle, GraduationCap, MapPin } from 'lucide-react';
import { getBaseUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'About NextGen Innovation & Research Journals',
  description: 'Learn about NextGen Innovation & Research Journals, an academic scholarly publisher based at Gower Street, London, United Kingdom, affiliated with University College London (UCL) and in strategic partnership with LOU Publishing and Information Services.',
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
          About NextGen Innovation &amp; Research Journals
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-light">
          A dedicated digital scholarly publisher based at Gower Street, London, United Kingdom, committed to high-standard peer review, transparent open access, and persistent scholarly infrastructure.
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
            Our Mission &amp; Positioning
          </h2>
          <p>
            NextGen Innovation &amp; Research Journals was established to address the critical need for rapid, rigorous, and completely unrestricted dissemination of advanced scientific and technical research. Headquartered at Gower Street, London, United Kingdom, with academic affiliation with University College London (UCL) and in strategic partnership with LOU Publishing and Information Services, the publisher specializes in computer science, artificial intelligence, cyber-physical systems, hardware architectures, and computational healthcare sciences.
          </p>
          <p>
            We believe scholarly knowledge is a global public good. All peer-reviewed articles published across our catalog are released under the Creative Commons Attribution 4.0 International License (CC BY 4.0), ensuring universal accessibility without subscription walls or reading barriers.
          </p>
        </section>

        {/* Institutional Affiliation & Publishing Partnerships */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UCL Affiliation Card */}
          <div className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 p-6 rounded-2xl border border-blue-200/90 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm scholarly-heading">
              <GraduationCap className="w-5 h-5 text-blue-700 shrink-0" />
              <span>Affiliated Institution: University College London (UCL)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              NextGen Innovation &amp; Research Journals operates with academic and research affiliation with <strong>University College London (UCL)</strong>, located at <strong>Gower Street, London, United Kingdom</strong>. This alliance fosters rigorous peer review methodologies, computational research benchmarks, and global discoverability.
            </p>
            <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Location: Gower Street, London, UK</span>
              <a href="https://www.ucl.ac.uk" target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold hover:underline">ucl.ac.uk &rarr;</a>
            </div>
          </div>

          {/* LOU Publishing Card */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 p-6 rounded-2xl border border-emerald-200/90 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm scholarly-heading">
              <Award className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Strategic Partner: LOU Publishing and Information Services</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              In strategic publishing collaboration with <strong>LOU Publishing and Information Services</strong>, based in Asaba, Delta State, Nigeria, we expand bibliographic indexing, digital archiving, and cross-continental open-access scholarly distribution.
            </p>
            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Asaba, Delta State, Nigeria</span>
              <a href="https://loupublishing.onrender.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold hover:underline">loupublishing.onrender.com &rarr;</a>
            </div>
          </div>
        </div>

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
            Editorial Independence &amp; Governance
          </h2>
          <p>
            Each journal under NextGen Innovation &amp; Research Journals is governed by an independent Editor-in-Chief and an international editorial board of recognized scholars. Editorial decisions are made strictly on scholarly merits, technical rigour, and methodological soundness, free from commercial or political influence.
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
