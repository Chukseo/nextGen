import React from 'react';
import Link from 'next/link';
import { ShieldCheck, BookOpen, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export default function EditorialPoliciesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14 space-y-12">
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Standards & Ethics</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 scholarly-heading">
          Editorial Policies & Publication Ethics
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-light">
          Standards governing peer review, double-anonymous screening, research integrity, author declarations, and Open Access publishing.
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
        {/* Section 1: Peer Review */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
            1. Peer Review Process & Editorial Workflow
          </h2>
          <p>
            All submitted manuscripts undergo an initial desk screening by the Editor-in-Chief or assigned Section Editor to evaluate scope alignment, metadata completeness, and initial readability. Submissions that pass desk check are assigned to at least two independent expert peer reviewers.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <span className="font-bold text-slate-900 uppercase">Double-Anonymous Peer Review Standard</span>
            <p>
              In our primary journals, peer review is double-anonymous. The identities of both the authors and the reviewers are withheld from each other throughout the review cycle. Authors are instructed to remove identifying names, institutions, and self-identifying citations from the manuscript prior to submission.
            </p>
          </div>
        </section>

        {/* Section 2: Authorship & Responsibilities */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
            2. Authorship Criteria & Ethical Declarations
          </h2>
          <p>
            Authorship credit must be based on substantial contributions to conception and design, acquisition of data, analysis, or drafting the article. The corresponding author is responsible for ensuring that all co-authors have approved the final manuscript version and agree to its submission.
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
            <li><strong>Conflict of Interest:</strong> Authors, editors, and reviewers must explicitly disclose any financial or personal interests that could bias their evaluation.</li>
            <li><strong>Ethics & Consent:</strong> When applicable, human participant studies must include explicit institutional review board (IRB) approval and informed consent statements.</li>
            <li><strong>Data Availability:</strong> Authors must state where datasets, scripts, and model checkpoints are archived.</li>
          </ul>
        </section>

        {/* Section 3: Plagiarism & Retractions */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
            3. Plagiarism Screening, Corrections, and Retractions
          </h2>
          <p>
            NextGen Press enforces a zero-tolerance policy regarding plagiarism, data fabrication, and improper duplicate submission. When significant post-publication errors are identified, formal Errata or Corrigenda notices are published and linked via Crossref Crossmark. If fundamental invalidity is proven, the paper will be retracted following COPE Retraction Guidelines.
          </p>
        </section>

        {/* Section 4: Open Access & Licensing */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
            4. Open Access & Creative Commons Licensing
          </h2>
          <p>
            NextGen Research and Innovation Press operates under the principles of Budapest Open Access Initiative (BOAI). All published articles are immediately and permanently free for anyone to read, download, copy, distribute, and cite under the <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="text-blue-700 underline font-semibold">Creative Commons Attribution 4.0 International License (CC BY 4.0)</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
