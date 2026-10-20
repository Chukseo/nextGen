'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import JournalHeader from '@/components/JournalHeader';
import { ShieldCheck, Settings, UploadCloud, BookOpen, Users, Mail, ArrowRight, Lock } from 'lucide-react';
import ScholarlyMarkdown from '@/components/ScholarlyMarkdown';
import AdminJournalSettingsModal from '@/components/AdminJournalSettingsModal';

export default function JournalPrivacyClient({
  journal,
}: {
  journal: any;
}) {
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

  const privacyText = journal.privacyStatement || `# Privacy Statement — ${journal.title}

> This journal is committed to safeguarding personal and research data in accordance with international data protection standards (including GDPR) and ethical scholarly publishing practices.

## Scope and Data Collection
The names, email addresses, institutional affiliations, ORCID identifiers, and biographical details entered in this journal site will be used exclusively for the stated purposes of this journal:
- Peer review workflow administration and manuscript correspondence.
- Proper authorship attribution and citation indexing.
- Distribution of publication alerts, calls for papers, and editorial communications.

## Third-Party Disclosure & Indexing
Personal data will not be made available for any other purpose or to any third party, except as required for public scholarly indexing (e.g., Crossref DOI registration, Google Scholar, PubMed, and bibliographic databases) where author names, affiliations, and ORCID identifiers form an integral part of the permanent scholarly record.

## Author & Reviewer Rights
Authors and reviewers may request verification, correction, or anonymization of non-published personal profiles by contacting the editorial office at ${eicEmail}. Published metadata remains immutable in accordance with Committee on Publication Ethics (COPE) retraction and correction guidelines.`;

  return (
    <div className="space-y-10 pb-16">
      <JournalHeader journal={journal} activeTab="privacy" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded inline-flex items-center gap-1 border border-emerald-200">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Data Protection & Privacy</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 scholarly-heading">
                  Privacy Statement
                </h1>
                <p className="text-xs text-slate-500">
                  Data governance, research ethics, and privacy regulations for {journal.title}
                </p>
              </div>

              {canManage && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-blue-200" />
                  <span>Edit Privacy Statement</span>
                </button>
              )}
            </div>

            {/* Render Scholarly Markdown */}
            <ScholarlyMarkdown content={privacyText} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-sm scholarly-heading">
              Journal Information
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Journal</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{journal.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Online ISSN</p>
                  <p className="font-medium text-slate-800">{journal.onlineIssn || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Print ISSN</p>
                  <p className="font-medium text-slate-800">{journal.printIssn || 'N/A'}</p>
                </div>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Publisher</p>
                <p className="font-medium text-slate-800">{journal.publisher || 'NextGen Innovation & Research Journals'}</p>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Editorial Office Inquiries</p>
                <a href={`mailto:${eicEmail}`} className="font-medium text-blue-600 hover:underline truncate block">
                  {eicEmail}
                </a>
                {eicName && (
                  <span className="text-[10px] text-slate-500 font-normal">Editor-in-Chief: {eicName}</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                href={`/submit?journal=${journal.id}`}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Submit Manuscript</span>
              </Link>
              <Link
                href={`/journals/${journal.slug}/contact`}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Contact Editorial Office</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Editor/Admin Settings Modal */}
      <AdminJournalSettingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        journal={journal}
        initialTab="privacy"
      />
    </div>
  );
}
