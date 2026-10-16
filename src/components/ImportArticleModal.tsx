'use client';

import React, { useState } from 'react';
import { X, UploadCloud, Plus, Trash2, CheckCircle, AlertTriangle, FileText, ExternalLink } from 'lucide-react';

interface AuthorInput {
  firstName: string;
  lastName: string;
  email: string;
  affiliation: string;
  country: string;
  orcid: string;
  isCorresponding: boolean;
}

export default function ImportArticleModal({
  isOpen,
  onClose,
  journals,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  journals: any[];
  onSuccess?: (message: string) => void;
}) {
  const [selectedJournalId, setSelectedJournalId] = useState(journals[0]?.id || '');
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [articleType, setArticleType] = useState('RESEARCH_ARTICLE');
  const [pageRange, setPageRange] = useState('1-15');
  const [articleNumber, setArticleNumber] = useState('');
  const [customDoi, setCustomDoi] = useState('');
  const [keywords, setKeywords] = useState('');
  const [references, setReferences] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Declarations
  const [conflictOfInterest, setConflictOfInterest] = useState('The authors declare no competing financial or non-financial interests.');
  const [fundingInfo, setFundingInfo] = useState('This research was supported through institutional academic funding.');
  const [dataAvailability, setDataAvailability] = useState('All analytical datasets and materials are available upon reasonable request.');

  // Authors
  const [authors, setAuthors] = useState<AuthorInput[]>([
    {
      firstName: '',
      lastName: '',
      email: '',
      affiliation: '',
      country: '',
      orcid: '',
      isCorresponding: true,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ articleUrl: string; message: string } | null>(null);

  if (!isOpen) return null;

  const currentJournal = journals.find((j) => j.id === selectedJournalId);
  const availableIssues: any[] = [];
  if (currentJournal?.volumes) {
    for (const v of currentJournal.volumes) {
      if (v.issues) {
        for (const iss of v.issues) {
          availableIssues.push({
            ...iss,
            label: `Vol. ${v.volumeNumber}, No. ${iss.issueNumber} (${iss.year}) - ${iss.title}`,
          });
        }
      }
    }
  }

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
      },
    ]);
  };

  const handleRemoveAuthor = (index: number) => {
    if (authors.length === 1) return;
    setAuthors(authors.filter((_, idx) => idx !== index));
  };

  const handleAuthorChange = (index: number, field: keyof AuthorInput, value: any) => {
    const updated = [...authors];
    updated[index] = { ...updated[index], [field]: value };
    setAuthors(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJournalId || !title.trim() || !abstract.trim()) {
      setError('Please provide the Journal, Article Title, and Abstract.');
      return;
    }

    if (authors.some((a) => !a.firstName.trim() || !a.lastName.trim())) {
      setError('All authors must have a First Name and Last Name.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('journalId', selectedJournalId);
      if (selectedIssueId) formData.append('issueId', selectedIssueId);
      formData.append('title', title.trim());
      if (subtitle.trim()) formData.append('subtitle', subtitle.trim());
      formData.append('abstract', abstract.trim());
      formData.append('articleType', articleType);
      formData.append('pageRange', pageRange.trim());
      if (articleNumber.trim()) formData.append('articleNumber', articleNumber.trim());
      if (customDoi.trim()) formData.append('doi', customDoi.trim());
      formData.append('authors', JSON.stringify(authors));
      formData.append('keywords', keywords);
      formData.append('references', references);
      formData.append('conflictOfInterest', conflictOfInterest);
      formData.append('fundingInfo', fundingInfo);
      formData.append('dataAvailability', dataAvailability);

      if (pdfFile) {
        formData.append('file', pdfFile);
      }

      const res = await fetch('/api/admin/articles/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import article');

      setResult({ articleUrl: data.articleUrl, message: data.message });
      if (onSuccess) onSuccess(data.message);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Direct Article Import (Bypass Workflow)
              </h3>
              <p className="text-xs text-slate-500">
                Directly import final typeset publication PDF & metadata into a journal issue without going through the screening and review workflow.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{result.message}</span>
              </div>
              <a
                href={result.articleUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 underline"
              >
                <span>View Published Article</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Journal & Issue Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Target Journal *
              </label>
              <select
                value={selectedJournalId}
                onChange={(e) => {
                  setSelectedJournalId(e.target.value);
                  setSelectedIssueId('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium bg-white"
                required
              >
                {journals.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Target Issue
              </label>
              <select
                value={selectedIssueId}
                onChange={(e) => setSelectedIssueId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium bg-white"
              >
                <option value="">Auto-assign to latest active issue</option>
                {availableIssues.map((iss) => (
                  <option key={iss.id} value={iss.id}>
                    {iss.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Article Info */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
              1. Article Metadata
            </h4>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Article Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Asynchronous Optimization of Distributed Large-Scale Neural Models"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. A Gradient Decomposition Benchmark on Heterogeneous Hardware"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Article Type</label>
                <select
                  value={articleType}
                  onChange={(e) => setArticleType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="RESEARCH_ARTICLE">Research Article</option>
                  <option value="REVIEW_ARTICLE">Review Article</option>
                  <option value="SHORT_COMMUNICATION">Short Communication</option>
                  <option value="TECHNICAL_NOTE">Technical Note</option>
                  <option value="CASE_STUDY">Case Study</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Page Range</label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. 1-16"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Custom DOI (Optional)</label>
                <input
                  type="text"
                  value={customDoi}
                  onChange={(e) => setCustomDoi(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Abstract *
              </label>
              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                rows={4}
                placeholder="Full scholarly abstract summarizing context, methods, core results, and scientific significance..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none leading-relaxed"
                required
              />
            </div>
          </div>

          {/* Authors Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                2. Contributing Authors
              </h4>
              <button
                type="button"
                onClick={handleAddAuthor}
                className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Author</span>
              </button>
            </div>

            <div className="space-y-3">
              {authors.map((author, index) => (
                <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[11px]">
                      Author #{index + 1}
                    </span>
                    {authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthor(index)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove author"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="First Name *"
                        value={author.firstName}
                        onChange={(e) => handleAuthorChange(index, 'firstName', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Last Name *"
                        value={author.lastName}
                        onChange={(e) => handleAuthorChange(index, 'lastName', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={author.email}
                        onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Affiliation / University"
                        value={author.affiliation}
                        onChange={(e) => handleAuthorChange(index, 'affiliation', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="ORCID iD (0000-0000-0000-0000)"
                        value={author.orcid}
                        onChange={(e) => handleAuthorChange(index, 'orcid', e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded bg-white text-[11px] font-mono w-52 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={author.country}
                        onChange={(e) => handleAuthorChange(index, 'country', e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded bg-white text-[11px] w-36 outline-none"
                      />
                    </div>
                    <label className="inline-flex items-center space-x-1.5 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={author.isCorresponding}
                        onChange={(e) => handleAuthorChange(index, 'isCorresponding', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[11px] font-semibold">Corresponding</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords & References */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
              3. Keywords & References
            </h4>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. Distributed Computing, Neural Networks, Cloud Optimization"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Bibliographic References (one per line)
              </label>
              <textarea
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                rows={3}
                placeholder="Dean, J., et al. (2012). Large Scale Distributed Deep Networks. NeurIPS.&#10;Li, M., et al. (2014). Scaling Distributed Machine Learning with Parameter Server. OSDI."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono text-[11px] leading-relaxed"
              />
            </div>
          </div>

          {/* Upload PDF */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
              4. Publication PDF File
            </h4>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center bg-slate-50 hover:bg-blue-50/40 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-1">
                <FileText className="w-8 h-8 text-blue-600" />
                <span className="font-bold text-slate-800">
                  {pdfFile ? pdfFile.name : 'Choose final typeset article PDF (PDF file)'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {pdfFile ? `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Upload publication PDF to be served on the article page and download links'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors flex items-center space-x-2 shadow"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{loading ? 'Importing & Publishing...' : 'Import & Publish Article'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
