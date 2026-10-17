import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import JournalHeader from '@/components/JournalHeader';
import { generateDefaultAuthorGuidelines } from '@/lib/guidelinesGenerator';
import { UploadCloud, CheckCircle, FileText, ArrowRight, BookOpen, ShieldCheck, HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalGuidelinesPage({
  params,
}: {
  params: { slug: string };
}) {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
  });

  if (!journal) {
    notFound();
  }

  const settingKey = `journal_guidelines_${journal.id}`;
  const savedSetting = await prisma.systemSetting.findUnique({
    where: { key: settingKey },
  });

  const rawGuidelines = savedSetting?.value || generateDefaultAuthorGuidelines(journal);

  return (
    <div className="space-y-10 pb-16">
      {/* Journal Masthead */}
      <JournalHeader journal={journal} activeTab="guidelines" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Column: Author Guidelines Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/90 shadow-sm space-y-8 text-slate-800">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-md">
                  Author Submission Manual
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 scholarly-heading">
                  Instructions for Authors
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Peer-reviewed scholarly formatting specifications for {journal.title}
                </p>
              </div>

              <Link
                href={`/submit?journal=${journal.id}`}
                className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all shrink-0 self-start sm:self-auto"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Submit Manuscript</span>
              </Link>
            </div>

            {/* Render Guidelines formatted as markdown-style academic sections */}
            <div className="prose prose-slate max-w-none text-sm space-y-6 leading-relaxed">
              {rawGuidelines.split('\n\n').map((block, idx) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                // Heading 1 (# ...)
                if (trimmed.startsWith('# ')) {
                  return (
                    <h2 key={idx} className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mt-6">
                      {trimmed.replace(/^#\s+/, '')}
                    </h2>
                  );
                }

                // Heading 2 (## ...)
                if (trimmed.startsWith('## ')) {
                  return (
                    <div key={idx} className="pt-2">
                      <h3 className="text-lg font-bold text-slate-900 text-blue-900 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block"></span>
                        {trimmed.replace(/^##\s+/, '')}
                      </h3>
                    </div>
                  );
                }

                // Heading 3 (### ...)
                if (trimmed.startsWith('### ')) {
                  return (
                    <h4 key={idx} className="text-base font-bold text-slate-900 mt-3">
                      {trimmed.replace(/^###\s+/, '')}
                    </h4>
                  );
                }

                // Blockquote (> ...)
                if (trimmed.startsWith('> ')) {
                  return (
                    <div key={idx} className="bg-blue-50/70 border-l-4 border-blue-600 p-4 rounded-r-lg text-slate-700 italic my-3 text-xs leading-relaxed">
                      {trimmed.replace(/^>\s+/, '')}
                    </div>
                  );
                }

                // List items
                if (trimmed.includes('\n- ') || trimmed.startsWith('- ') || trimmed.includes('\n1. ') || /^\d+\.\s+/.test(trimmed)) {
                  const lines = trimmed.split('\n');
                  return (
                    <ul key={idx} className="space-y-1.5 pl-4 list-disc text-slate-700">
                      {lines.map((line, lIdx) => {
                        const cleanLine = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
                        if (!cleanLine) return null;
                        return (
                          <li key={lIdx} className="leading-relaxed">
                            {cleanLine.includes('**') ? (
                              <span>
                                {cleanLine.split('**').map((seg, sIdx) =>
                                  sIdx % 2 === 1 ? <strong key={sIdx} className="text-slate-900 font-bold">{seg}</strong> : seg
                                )}
                              </span>
                            ) : (
                              cleanLine
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  );
                }

                // Horizontal rule
                if (trimmed === '---') {
                  return <hr key={idx} className="border-slate-200 my-4" />;
                }

                // Standard paragraph
                return (
                  <p key={idx} className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                    {trimmed.includes('**') ? (
                      <span>
                        {trimmed.split('**').map((seg, sIdx) =>
                          sIdx % 2 === 1 ? <strong key={sIdx} className="text-slate-900 font-bold">{seg}</strong> : seg
                        )}
                      </span>
                    ) : (
                      trimmed
                    )}
                  </p>
                );
              })}
            </div>

            {/* Bottom submission action */}
            <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-6 rounded-xl">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Ready to submit your research?</h4>
                <p className="text-xs text-slate-500 mt-0.5">Ensure your manuscript complies with the formatting and ethical criteria above.</p>
              </div>
              <Link
                href={`/submit?journal=${journal.id}`}
                className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow transition-all shrink-0"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Start Submission Wizard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar: Checklist, File Types, Help */}
        <div className="space-y-8">
          {/* Submission Checklist */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
              Submission Checklist
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Manuscript in <strong>.docx</strong>, <strong>.doc</strong>, or <strong>.pdf</strong> format</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Structured abstract (150–250 words) & 4–6 keywords</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>All co-authors, affiliations, emails & ORCIDs prepared</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Funding, Conflict of Interest & Data Availability statements</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>All cited references verified with DOIs where available</span>
              </li>
            </ul>
          </div>

          {/* Peer Review Model */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs text-slate-600">
            <h3 className="text-base font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
              Review & Licensing
            </h3>
            <div>
              <span className="font-bold text-slate-900 block">Review Policy</span>
              <span>{journal.peerReviewPolicy}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">License Model</span>
              <span className="text-emerald-700 font-semibold">{journal.licensingPolicy}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Publication Fees (APC)</span>
              <span>{journal.apcInfo || 'No author fees.'}</span>
            </div>
          </div>

          {/* Need Assistance? */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-6 rounded-xl border border-blue-800 shadow-md space-y-3 text-xs">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-blue-300" />
              <h3 className="text-base font-bold text-white scholarly-heading">
                Editorial Assistance
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              Questions regarding presubmission inquiries or formatting requirements? Contact the managing editor at:
            </p>
            <div className="pt-1 font-semibold text-blue-300">
              <a href={`mailto:${journal.contactEmail}`} className="hover:underline">
                {journal.contactEmail}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
