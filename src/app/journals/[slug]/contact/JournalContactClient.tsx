'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import JournalHeader from '@/components/JournalHeader';
import { Mail, Phone, MapPin, Settings, UploadCloud, Users, BookOpen, Clock, Globe } from 'lucide-react';
import ScholarlyMarkdown from '@/components/ScholarlyMarkdown';
import AdminJournalSettingsModal from '@/components/AdminJournalSettingsModal';

export default function JournalContactClient({
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

  const contactText = journal.contactDetails || `# Editorial & Publication Office — ${journal.title}

## Principal Contact
- **Email:** ${journal.contactEmail || 'editorial@nextgenjournals.org'}
- **Department:** Editorial Council & Manuscript Operations
- **Hours:** Monday – Friday, 08:00 – 18:00 (GMT)

## Support & Inquiries
- **Submission & Peer Review Enquiries:** submissions@nextgenjournals.org
- **Technical & Indexing Queries:** tech-support@nextgenjournals.org
- **Production & Offprint Queries:** production@nextgenjournals.org

## Publisher Headquarters
NextGen Innovation & Research Journals
Scholarly Publications Directorate
Global Academic Publishing Center
Email: publishing@nextgenjournals.org`;

  return (
    <div className="space-y-10 pb-16">
      <JournalHeader journal={journal} activeTab="contact" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded inline-flex items-center gap-1 border border-blue-200">
                    <Mail className="w-3 h-3 text-blue-600" />
                    <span>Editorial Directory</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 scholarly-heading">
                  Contact Information
                </h1>
                <p className="text-xs text-slate-500">
                  Direct channels for authors, reviewers, readers, and institutional subscribers for {journal.title}
                </p>
              </div>

              {canManage && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-blue-200" />
                  <span>Edit Contact Info</span>
                </button>
              )}
            </div>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start space-x-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-lg shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold uppercase text-blue-900">Direct Editorial Email</p>
                  <a
                    href={`mailto:${journal.contactEmail || 'editorial@nextgenjournals.org'}`}
                    className="text-sm font-bold text-blue-700 hover:underline truncate block"
                  >
                    {journal.contactEmail || 'editorial@nextgenjournals.org'}
                  </a>
                  <p className="text-[11px] text-slate-500">Fast response within 24-48 business hours</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start space-x-3">
                <div className="p-2.5 bg-slate-700 text-white rounded-lg shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-700">Editorial Office Hours</p>
                  <p className="text-sm font-bold text-slate-800">Mon – Fri, 08:00 – 18:00 GMT</p>
                  <p className="text-[11px] text-slate-500">Dedicated desk for manuscript inquiries</p>
                </div>
              </div>
            </div>

            {/* Render Scholarly Markdown */}
            <div className="pt-4 border-t border-slate-100">
              <ScholarlyMarkdown content={contactText} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-sm scholarly-heading">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href={`/submit?journal=${journal.id}`}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Submit a Manuscript</span>
              </Link>
              <Link
                href={`/journals/${journal.slug}/editorial-board`}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>View Editorial Board</span>
              </Link>
              <Link
                href={`/journals/${journal.slug}/guidelines`}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Author Guidelines</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Publisher</p>
                <p className="font-medium text-slate-800">NextGen Innovation & Research Journals</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Access Policy</p>
                <p className="font-medium text-emerald-700">Open Access (CC BY 4.0)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor/Admin Settings Modal */}
      <AdminJournalSettingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        journal={journal}
        initialTab="contact"
      />
    </div>
  );
}
