'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import JournalHeader from '@/components/JournalHeader';
import { UploadCloud, CheckCircle, FileText, Settings, BookOpen, ShieldCheck, HelpCircle } from 'lucide-react';
import ScholarlyMarkdown from '@/components/ScholarlyMarkdown';
import AdminJournalSettingsModal from '@/components/AdminJournalSettingsModal';

interface JournalGuidelinesClientProps {
  journal: any;
  guidelinesText: string;
}

export default function JournalGuidelinesClient({
  journal,
  guidelinesText,
}: JournalGuidelinesClientProps) {
  const { data: session } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  const roles = (session?.user as any)?.roles || [];
  const isMasterAdmin = roles.some((r: any) => r.role === 'MASTER_ADMIN' || r.role === 'JOURNAL_MANAGER');
  const isJournalEditor = roles.some(
    (r: any) =>
      (r.role === 'EDITOR' || r.role === 'SECTION_EDITOR') &&
      (!r.journalId || r.journalId === journal.id)
  );
  const canManage = isMasterAdmin || isJournalEditor;

  const eicMember = journal.editorialBoard?.find(
    (m: any) =>
      m.roleTitle?.toLowerCase().includes('editor-in-chief') ||
      m.roleTitle?.toLowerCase().includes('chief')
  );
  const eicEmail = eicMember?.user?.email || eicMember?.email || journal.contactEmail || 'nextgenjournals@gmail.com';
  const eicName = eicMember?.user?.name || eicMember?.name;

  return (
    <div className="space-y-10 pb-16">
      {/* Journal Masthead */}
      <JournalHeader journal={journal} activeTab="guidelines" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Column: Author Guidelines Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-800">
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

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
                {canManage && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 transition-all cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span>Edit Author Guidelines</span>
                  </button>
                )}
                <Link
                  href={`/submit?journal=${journal.id}`}
                  className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Submit Manuscript</span>
                </Link>
              </div>
            </div>

            {/* Render Guidelines formatted with ScholarlyMarkdown */}
            <ScholarlyMarkdown content={guidelinesText} />

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
              <span className="font-bold text-slate-900 block">Publisher</span>
              <span>{journal.publisher || 'NextGen Innovation & Research Journals'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Review Policy</span>
              <span>{journal.peerReviewPolicy || 'Double-anonymous peer review'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">License Model</span>
              <span className="text-emerald-700 font-semibold">{journal.licensingPolicy || 'Open Access (CC BY 4.0)'}</span>
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
              Questions regarding presubmission inquiries or formatting requirements? Contact the {eicName ? `Editor-in-Chief (${eicName})` : 'editorial desk'} at:
            </p>
            <div className="pt-1 font-semibold text-blue-300">
              <a href={`mailto:${eicEmail}`} className="hover:underline">
                {eicEmail}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Editor/Admin Settings Modal */}
      <AdminJournalSettingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        journal={journal}
        initialTab="guidelines"
      />
    </div>
  );
}
