'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Mail,
  Info,
  Check,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { generateDefaultAuthorGuidelines } from '@/lib/guidelinesGenerator';

interface AdminJournalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: {
    id: string;
    slug: string;
    title: string;
    abbreviation: string;
    aboutDetails?: string | null;
    privacyStatement?: string | null;
    contactDetails?: string | null;
    contactEmail?: string | null;
    authorGuidelines?: string | null;
    aimsScope?: string | null;
    peerReviewPolicy?: string | null;
    openAccessPolicy?: string | null;
    licensingPolicy?: string | null;
    apcInfo?: string | null;
  } | null;
  initialTab?: 'about' | 'privacy' | 'contact' | 'guidelines';
  onSaved?: () => void;
}

export default function AdminJournalSettingsModal({
  isOpen,
  onClose,
  journal,
  initialTab = 'about',
  onSaved,
}: AdminJournalSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'privacy' | 'contact' | 'guidelines'>(initialTab);
  const [aboutDetails, setAboutDetails] = useState('');
  const [privacyStatement, setPrivacyStatement] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [authorGuidelines, setAuthorGuidelines] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && journal) {
      setActiveTab(initialTab);
      setAboutDetails(journal.aboutDetails || '');
      setPrivacyStatement(journal.privacyStatement || '');
      setContactDetails(journal.contactDetails || '');
      setAuthorGuidelines(journal.authorGuidelines || '');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, journal?.id, initialTab]);

  if (!isOpen || !journal) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {};
      if (activeTab === 'about') {
        payload.aboutDetails = aboutDetails;
      } else if (activeTab === 'privacy') {
        payload.privacyStatement = privacyStatement;
      } else if (activeTab === 'contact') {
        payload.contactDetails = contactDetails;
      } else if (activeTab === 'guidelines') {
        payload.authorGuidelines = authorGuidelines;
      }

      const res = await fetch(`/api/admin/journals/${journal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes');

      const labelMap: Record<string, string> = {
        about: 'About Details',
        privacy: 'Privacy Statement',
        contact: 'Contact Details',
        guidelines: 'Author Guidelines',
      };
      setSuccessMsg(`${labelMap[activeTab] || 'Journal content'} updated successfully.`);
      if (onSaved) onSaved();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (!window.confirm('Reset this section to standard academic template? Any unsaved edits will be lost.')) {
      return;
    }

    if (activeTab === 'about') {
      setAboutDetails(`### About ${journal.title}\n\n**${journal.title}** (${journal.abbreviation}) is a premier, peer-reviewed international academic journal published under **NextGen Innovation & Research Journals**. The journal is dedicated to advancing theoretical and applied scholarly research through high-impact, rigorously reviewed contributions.\n\n#### Aims and Scope\nOriginal research, comprehensive review articles, and scholarly communications undergo rigorous double-anonymous peer review.\n\n#### Open Access Mandate\nAll articles published in ${journal.title} are made permanently and freely accessible online immediately upon publication under the terms of the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**. Authors retain full copyright of their intellectual output.\n\n#### Peer Review and Archiving\nWe employ a strict double-anonymous peer review protocol to guarantee objective, merit-based evaluations. All published manuscripts receive a Crossref Digital Object Identifier (DOI) and are digitally preserved across institutional and global scholarly indexing networks including Google Scholar.`);
    } else if (activeTab === 'privacy') {
      setPrivacyStatement(`### Scholarly Privacy Statement — ${journal.title}\n\n**NextGen Innovation & Research Journals** and the editorial board of **${journal.title}** are dedicated to protecting the privacy, identity, and personal information of our contributing authors, reviewers, editors, and platform visitors.\n\n#### 1. Personal Information Collected\nThe names, institutional affiliations, academic credentials, ORCID identifiers, and email addresses entered in this journal site will be used exclusively for the stated purposes of scholarly communication, peer review management, and publication administration. They will not be made available for any commercial purpose or shared with third parties.\n\n#### 2. Confidentiality of Manuscript Submissions\nUnpublished manuscripts submitted to ${journal.title} remain strictly confidential intellectual property. Editors, section editors, and external reviewers are bound by non-disclosure ethics and must not share, cite, or exploit manuscript materials or data prior to formal publication.\n\n#### 3. Reviewer Anonymity\nIn accordance with our **Double-Anonymous Peer Review Policy**, the identities of referees are kept strictly confidential from authors and the public. Reviewer reports are transmitted through the editorial system without revealing referee identities.\n\n#### 4. Post-Publication Archiving and Attribution\nUpon formal publication, author names, affiliations, article metadata, and registered DOIs enter the permanent public scientific record. Metadata is deposited with Crossref, Google Scholar, and scholarly indexing repositories to ensure persistent attribution.\n\n#### 5. Contact Regarding Privacy Inquiries\nQuestions regarding data protection or requests to update personal information may be addressed directly to the Editorial Office at **${journal.contactEmail || 'nextgenjournals@gmail.com'}**.`);
    } else if (activeTab === 'contact') {
      setContactDetails(`### Editorial Office & Inquiries — ${journal.title}\n\n**${journal.title}** (${journal.abbreviation})\n*Published by NextGen Innovation & Research Journals*\n\n#### Primary Editorial Office\n- **Editorial Inquiries:** [${journal.contactEmail || 'nextgenjournals@gmail.com'}](mailto:${journal.contactEmail || 'nextgenjournals@gmail.com'})\n- **General Publisher Support:** [nextgenjournals@gmail.com](mailto:nextgenjournals@gmail.com)\n- **Office Location:** NextGen Innovation & Research Directorate, Lagos, Nigeria\n\n#### Editorial Leadership & Desk Inquiries\n- **Editor-in-Chief Office:** Available for scope determinations, pre-submission inquiries, and special issue proposals.\n- **Production & Typesetting Desk:** For queries regarding proof corrections, DOI resolution, and PDF downloads.\n- **Ethics & Review Integrity:** For queries regarding double-anonymous refereeing and publication ethics compliance.\n\n*Response Time: The editorial office typically responds to formal author inquiries within 24 to 48 hours.*`);
    } else if (activeTab === 'guidelines') {
      const generated = generateDefaultAuthorGuidelines({
        title: journal.title,
        abbreviation: journal.abbreviation,
        slug: journal.slug,
        aimsScope: journal.aimsScope || '',
        peerReviewPolicy: journal.peerReviewPolicy || 'Double-anonymous peer review',
        openAccessPolicy: journal.openAccessPolicy || 'Open Access (CC BY 4.0)',
        licensingPolicy: journal.licensingPolicy || 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
        apcInfo: journal.apcInfo || 'No author fees.',
        contactEmail: journal.contactEmail || 'nextgenjournals@gmail.com',
        publisher: 'NextGen Innovation & Research Journals',
      });
      setAuthorGuidelines(generated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  {journal.abbreviation}
                </span>
                <h3 className="text-lg font-bold text-slate-900 scholarly-heading">
                  Journal Content & Editorial Settings
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit About text, Privacy Statement, and Contact details for {journal.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-6 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('about'); setError(null); setSuccessMsg(null); }}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-blue-600 text-blue-700 bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Details</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('guidelines'); setError(null); setSuccessMsg(null); }}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'guidelines'
                ? 'border-blue-600 text-blue-700 bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Author Guidelines</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('privacy'); setError(null); setSuccessMsg(null); }}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-blue-600 text-blue-700 bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Statement</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('contact'); setError(null); setSuccessMsg(null); }}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-blue-600 text-blue-700 bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Details</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center space-x-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              {activeTab === 'about' && 'About Journal Detailed Text Area (Markdown Supported)'}
              {activeTab === 'guidelines' && 'Author Guidelines & Submission Instructions (Markdown Supported)'}
              {activeTab === 'privacy' && 'Journal Privacy Statement (Markdown Supported)'}
              {activeTab === 'contact' && 'Editorial Contact & Inquiries Information (Markdown Supported)'}
            </label>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center space-x-1 text-[11px] text-blue-700 hover:text-blue-900 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Load Scholarly Template</span>
            </button>
          </div>

          {activeTab === 'about' && (
            <div className="space-y-2">
              <textarea
                rows={16}
                value={aboutDetails}
                onChange={(e) => setAboutDetails(e.target.value)}
                placeholder="Write or paste comprehensive details about the journal's founding, mission, aims, scope, and editorial ethos..."
                className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500">
                This content displays prominently in the About & Scope section on the journal's homepage.
              </p>
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div className="space-y-2">
              <textarea
                rows={16}
                value={authorGuidelines}
                onChange={(e) => setAuthorGuidelines(e.target.value)}
                placeholder="Enter detailed author guidelines, accepted manuscript structures, formatting instructions, and ethical standards..."
                className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500">
                This content displays on the journal's public Author Guidelines page (/journals/{journal.slug}/guidelines).
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-2">
              <textarea
                rows={16}
                value={privacyStatement}
                onChange={(e) => setPrivacyStatement(e.target.value)}
                placeholder="Enter privacy statement, author confidentiality policy, and reviewer anonymity guidelines..."
                className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500">
                This content displays on the journal's public Privacy Statement page (/journals/{journal.slug}/privacy).
              </p>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-2">
              <textarea
                rows={16}
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
                placeholder="Enter editorial office addresses, editor inquiries, phone numbers, and communication channels..."
                className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500">
                This content displays on the journal's dedicated Contact page (/journals/{journal.slug}/contact).
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Markdown formatting (`### headings`, `**bold**`, `[links](url)`) is fully supported.
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center space-x-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      Save{' '}
                      {activeTab === 'about'
                        ? 'About Details'
                        : activeTab === 'guidelines'
                        ? 'Author Guidelines'
                        : activeTab === 'privacy'
                        ? 'Privacy Statement'
                        : 'Contact Info'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
