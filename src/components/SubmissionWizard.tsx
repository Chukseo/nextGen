'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  FileText,
  UserPlus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  HelpCircle
} from 'lucide-react';
import { ArticleType, ReviewModel, AuthorMetadata } from '@/types';

interface JournalOption {
  id: string;
  slug: string;
  title: string;
  abbreviation: string;
  aimsScope: string;
  peerReviewPolicy: string;
}

export default function SubmissionWizard({
  journals,
  initialJournalId,
  userSession,
}: {
  journals: JournalOption[];
  initialJournalId?: string;
  userSession: any;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [journalId, setJournalId] = useState(initialJournalId || journals[0]?.id || '');
  const [articleType, setArticleType] = useState<ArticleType>('RESEARCH_ARTICLE');
  const [reviewModel, setReviewModel] = useState<ReviewModel>('DOUBLE_ANONYMOUS');

  // Metadata
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [discipline, setDiscipline] = useState('Computer Science - Artificial Intelligence');
  const [language, setLanguage] = useState('en');
  const [keywords, setKeywords] = useState('Machine Learning, Distributed Systems');
  const [conflictOfInterest, setConflictOfInterest] = useState('The authors declare that they have no competing financial or non-financial interests.');
  const [ethicsStatement, setEthicsStatement] = useState('Not applicable. No human participants or vertebrate animals were involved in this computational study.');
  const [fundingInfo, setFundingInfo] = useState('');
  const [dataAvailability, setDataAvailability] = useState('All experimental scripts, model architectures, and benchmark configurations are openly available as cited in the paper.');
  const [coverLetter, setCoverLetter] = useState('');
  const [declarationsConfirmed, setDeclarationsConfirmed] = useState(false);

  // Authors List
  const [authors, setAuthors] = useState<AuthorMetadata[]>([
    {
      firstName: userSession?.name?.split(' ')[0] || 'David',
      lastName: userSession?.name?.split(' ').slice(1).join(' ') || 'Lewis',
      email: userSession?.email || 'author@institution.edu',
      affiliation: userSession?.affiliation || 'Stanford University',
      country: 'United States',
      orcid: userSession?.orcid || '0000-0001-6789-2311',
      isCorresponding: true,
      authorOrder: 1,
    },
  ]);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ submissionNumber: string; id: string } | null>(null);

  const selectedJournal = journals.find((j) => j.id === journalId) || journals[0];

  const handleAddAuthor = () => {
    setAuthors([
      ...authors,
      {
        firstName: '',
        lastName: '',
        email: '',
        affiliation: '',
        country: '',
        orcid: '',
        isCorresponding: false,
        authorOrder: authors.length + 1,
      },
    ]);
  };

  const handleRemoveAuthor = (index: number) => {
    if (authors.length <= 1) return;
    const updated = authors.filter((_, i) => i !== index).map((a, i) => ({ ...a, authorOrder: i + 1 }));
    setAuthors(updated);
  };

  const handleAuthorChange = (index: number, field: keyof AuthorMetadata, value: any) => {
    const updated = [...authors];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'isCorresponding' && value === true) {
      // Unset other corresponding authors if desired, or keep multiple
      updated.forEach((a, i) => {
        if (i !== index) a.isCorresponding = false;
      });
    }
    setAuthors(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx' && ext !== 'doc') {
      setUploadError('Only Microsoft Word (.doc, .docx) manuscript files are permitted.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('bucket', 'manuscripts-private');

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setFile(selectedFile);
      setUploadedKey(data.storageKey);
      setUploadedFileName(data.fileName);
      setUploadedFileSize(data.fileSize);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!uploadedKey || !uploadedFileName || !uploadedFileSize) {
      setSubmitError('Please upload your manuscript Word document.');
      return;
    }
    if (!declarationsConfirmed) {
      setSubmitError('You must confirm the publication declarations.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      journalId,
      articleType,
      title,
      subtitle,
      abstract,
      discipline,
      language,
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      reviewModel,
      authors,
      conflictOfInterest,
      ethicsStatement,
      fundingInfo,
      dataAvailability,
      coverLetter,
      declarationsConfirmed,
      uploadedFileKey: uploadedKey,
      uploadedFileName: uploadedFileName,
      uploadedFileSize: uploadedFileSize,
    };

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.details ? JSON.stringify(data.details) : 'Submission failed'));
      }

      setReceipt({
        submissionNumber: data.submissionNumber,
        id: data.submissionId,
      });
      setCurrentStep(5);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Wizard Progress Stepper */}
      <div className="bg-navy-950 text-white p-6 border-b border-navy-900">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs font-semibold">
          {[
            { num: 1, label: 'Journal & Type' },
            { num: 2, label: 'Article Metadata' },
            { num: 3, label: 'Upload Word DOCX' },
            { num: 4, label: 'Review & Confirm' },
            { num: 5, label: 'Receipt' },
          ].map((s) => (
            <div key={s.num} className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-colors ${
                  currentStep === s.num
                    ? 'bg-blue-600 text-white shadow'
                    : currentStep > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-navy-850 text-slate-400'
                }`}
              >
                {currentStep > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`hidden sm:inline ${currentStep === s.num ? 'text-white' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-10 max-w-4xl mx-auto">
        {submitError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* STEP 1: Select Journal & Article Type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
                Step 1: Select Target Journal and Article Type
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the appropriate journal and scholarly contribution format for your manuscript.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Journal *
                </label>
                <select
                  value={journalId}
                  onChange={(e) => setJournalId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  {journals.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              {selectedJournal && (
                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-lg text-xs space-y-2 text-slate-700">
                  <div className="font-bold text-blue-900">{selectedJournal.title}</div>
                  <p className="leading-relaxed">{selectedJournal.aimsScope}</p>
                  <div className="pt-1 text-slate-500">
                    <span className="font-semibold text-slate-700">Peer Review Model:</span> {selectedJournal.peerReviewPolicy}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Article Type *
                  </label>
                  <select
                    value={articleType}
                    onChange={(e) => setArticleType(e.target.value as ArticleType)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="RESEARCH_ARTICLE">Original Research Article</option>
                    <option value="REVIEW_ARTICLE">Comprehensive Systematic Review</option>
                    <option value="SHORT_COMMUNICATION">Short Communication</option>
                    <option value="TECHNICAL_REPORT">Technical Report / Architecture</option>
                    <option value="CASE_STUDY">Case Study</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Peer Review Track
                  </label>
                  <select
                    value={reviewModel}
                    onChange={(e) => setReviewModel(e.target.value as ReviewModel)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="DOUBLE_ANONYMOUS">Double-Anonymous (Author & Reviewer blinded)</option>
                    <option value="SINGLE_ANONYMOUS">Single-Anonymous (Reviewer blinded to author)</option>
                    <option value="OPEN">Open Peer Review (Identities declared)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs px-6 py-2.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow"
              >
                <span>Continue to Metadata</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Enter Metadata & Authors */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
                Step 2: Article Metadata and Author List
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Input complete scholarly metadata. Ensure author order accurately represents contribution.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Asynchronous Optimization of Foundation Models on Heterogeneous Hardware"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="A Theoretical and Empirical Investigation"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Abstract * (Min 50 characters)
                </label>
                <textarea
                  rows={5}
                  required
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Provide a structured abstract stating background, methodology, primary results, and conclusions..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none font-serif text-slate-800"
                />
                <div className="text-[11px] text-slate-400 text-right">{abstract.length} characters</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Keywords * (Comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Deep Learning, Distributed Systems, GPU"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Discipline / Subject Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    placeholder="Computer Science - AI"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Author List Management */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Authors ({authors.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddAuthor}
                    className="inline-flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-900 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Co-Author</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {authors.map((author, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          Author #{idx + 1}
                        </span>
                        {authors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAuthor(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove author"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">First Name *</label>
                          <input
                            type="text"
                            required
                            value={author.firstName}
                            onChange={(e) => handleAuthorChange(idx, 'firstName', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">Last Name *</label>
                          <input
                            type="text"
                            required
                            value={author.lastName}
                            onChange={(e) => handleAuthorChange(idx, 'lastName', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={author.email}
                            onChange={(e) => handleAuthorChange(idx, 'email', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">Institutional Affiliation *</label>
                          <input
                            type="text"
                            required
                            value={author.affiliation}
                            onChange={(e) => handleAuthorChange(idx, 'affiliation', e.target.value)}
                            placeholder="e.g. Stanford University"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">ORCID iD (Optional)</label>
                          <input
                            type="text"
                            value={author.orcid || ''}
                            onChange={(e) => handleAuthorChange(idx, 'orcid', e.target.value)}
                            placeholder="0000-0002-1825-0097"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-5">
                          <input
                            type="checkbox"
                            id={`corr-${idx}`}
                            checked={author.isCorresponding}
                            onChange={(e) => handleAuthorChange(idx, 'isCorresponding', e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <label htmlFor={`corr-${idx}`} className="text-xs font-semibold text-slate-700">
                            Corresponding Author
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ethics, Data, and Declarations Statements */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Ethical Statements & Transparency
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Conflict of Interest Declaration</label>
                    <input
                      type="text"
                      value={conflictOfInterest}
                      onChange={(e) => setConflictOfInterest(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ethics Approval Statement</label>
                    <input
                      type="text"
                      value={ethicsStatement}
                      onChange={(e) => setEthicsStatement(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Data Availability Statement</label>
                    <input
                      type="text"
                      value={dataAvailability}
                      onChange={(e) => setDataAvailability(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Funding & Grants</label>
                    <input
                      type="text"
                      value={fundingInfo}
                      onChange={(e) => setFundingInfo(e.target.value)}
                      placeholder="e.g. National Science Foundation Grant CNS-2401882"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!title || !abstract || abstract.length < 50}
                onClick={() => setCurrentStep(3)}
                className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs px-6 py-2.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow disabled:opacity-50"
              >
                <span>Continue to Upload</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Upload Manuscript */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
                Step 3: Upload Manuscript Document
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload your blinded manuscript as a Microsoft Word document (.docx or .doc).
              </p>
            </div>

            <div className="space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
                  {uploadError}
                </div>
              )}

              {/* Drag/Drop Box */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center space-y-3 bg-slate-50/50 transition-colors">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <label className="cursor-pointer font-bold text-blue-700 hover:underline text-sm">
                    <span>Click to select Word document</span>
                    <input
                      type="file"
                      accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts .docx or .doc format (up to 50MB)
                  </p>
                </div>

                {uploading && (
                  <div className="text-xs text-blue-700 font-semibold animate-pulse">
                    Uploading and verifying file integrity...
                  </div>
                )}

                {uploadedKey && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between max-w-md mx-auto">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">{uploadedFileName}</span>
                    </div>
                    <span className="text-[11px] text-emerald-600">Verified</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-100 rounded-lg text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">Double-Anonymous Preparation:</span>
                <p>
                  Ensure all author names, affiliations, and identifying metadata are stripped from the main manuscript text and file properties before uploading.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confidential Cover Letter for Editors (Optional)
                </label>
                <textarea
                  rows={3}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Explain why your submission fits the journal's scope and summarize any prior related publications..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!uploadedKey}
                onClick={() => setCurrentStep(4)}
                className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs px-6 py-2.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow disabled:opacity-50"
              >
                <span>Review Submission</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review and Confirm */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
                Step 4: Final Submission Review
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please verify all metadata and confirm publishing declarations before completing submission.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <div>
                  <span className="font-bold text-slate-500 uppercase">Target Journal:</span>
                  <div className="text-sm font-bold text-slate-900">{selectedJournal?.title}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase">Article Title:</span>
                  <div className="text-sm font-bold text-slate-900">{title}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase">Authors:</span>
                  <div className="text-slate-800">
                    {authors.map((a) => `${a.firstName} ${a.lastName} (${a.affiliation})`).join('; ')}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase">Manuscript File:</span>
                  <div className="font-mono text-blue-700">{uploadedFileName}</div>
                </div>
              </div>

              {/* Declarations Checkbox */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="decl"
                    required
                    checked={declarationsConfirmed}
                    onChange={(e) => setDeclarationsConfirmed(e.target.checked)}
                    className="mt-1 rounded text-blue-700"
                  />
                  <label htmlFor="decl" className="text-xs text-amber-950 leading-relaxed font-medium">
                    I confirm that this manuscript is original, has not been published previously, is not under consideration by another journal, complies with NextGen Press publication ethics guidelines, and all named co-authors have reviewed and approved the submission.
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting || !declarationsConfirmed}
                onClick={handleSubmitFinal}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-8 py-3 rounded-lg flex items-center space-x-2 transition-colors shadow disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{submitting ? 'Submitting Manuscript...' : 'Submit Manuscript Now'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Submission Receipt */}
        {currentStep === 5 && receipt && (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 scholarly-heading">
                Manuscript Successfully Submitted!
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your manuscript has been safely uploaded and queued in the editorial desk screening workflow.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-md mx-auto text-left space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase">Submission Number:</span>
                <span className="block text-base font-mono font-bold text-blue-700">{receipt.submissionNumber}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase">Initial Status:</span>
                <span className="block text-emerald-700 font-bold">SUBMITTED (Desk Screening Pending)</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase">Timestamp:</span>
                <span className="block text-slate-700">{new Date().toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/author')}
                className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs px-6 py-2.5 rounded-lg transition-colors shadow"
              >
                Go to Author Portal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
