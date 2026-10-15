'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  UploadCloud,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Send,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react';

export default function AuthorDashboardClient({ submissions }: { submissions: any[] }) {
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [revisionUploading, setRevisionUploading] = useState(false);
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [revisionSuccess, setRevisionSuccess] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'INITIAL_SCREENING':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded font-bold">Desk Screening</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded font-bold">Under Review</span>;
      case 'REVISIONS_REQUESTED':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded font-bold">Revisions Requested</span>;
      case 'REVISION_SUBMITTED':
        return <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded font-bold">Revision Submitted</span>;
      case 'ACCEPTED':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-bold">Accepted</span>;
      case 'PUBLISHED':
        return <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded font-bold">Published</span>;
      case 'REJECTED':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded font-bold">Declined</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded font-bold">{status}</span>;
    }
  };

  const handleUploadRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !revisionFile || !responseNotes) return;

    setRevisionUploading(true);
    setRevisionError(null);
    setRevisionSuccess(null);

    try {
      // 1. Upload revised file
      const formData = new FormData();
      formData.append('file', revisionFile);
      formData.append('bucket', 'manuscripts-private');

      const uploadRes = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'File upload failed');

      // 2. Submit revision record
      const revRes = await fetch(`/api/submissions/${selectedSub.id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedFileKey: uploadData.storageKey,
          uploadedFileName: uploadData.fileName,
          uploadedFileSize: uploadData.fileSize,
          responseToReviewers: responseNotes,
        }),
      });
      const revData = await revRes.json();
      if (!revRes.ok) throw new Error(revData.error || 'Revision recording failed');

      setRevisionSuccess(`Revision v${revData.versionNumber} successfully submitted.`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setRevisionError(err.message);
    } finally {
      setRevisionUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase font-semibold">Total Submissions</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{submissions.length}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase font-semibold">Under Active Review</span>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {submissions.filter((s) => s.status === 'UNDER_REVIEW' || s.status === 'REVISIONS_REQUESTED').length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase font-semibold">Accepted & Published</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {submissions.filter((s) => s.status === 'ACCEPTED' || s.status === 'PUBLISHED').length}
          </div>
        </div>
      </div>

      {/* Submissions Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 scholarly-heading">
              Your Manuscript Submissions
            </h2>
            <p className="text-xs text-slate-500">Track editorial reviews, download files, and upload revisions.</p>
          </div>
          <Link
            href="/submit"
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2 rounded shadow transition-colors flex items-center space-x-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>New Submission</span>
          </Link>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 space-y-3">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p>You have not submitted any manuscripts yet.</p>
            <Link
              href="/submit"
              className="text-xs text-blue-700 font-semibold hover:underline"
            >
              Start your first submission
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => {
              const primaryFile = sub.files?.[0];
              const latestDecision = sub.editorialDecisions?.[0];

              return (
                <div key={sub.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {sub.submissionNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        {sub.journal?.title}
                      </span>
                    </div>
                    <div>{getStatusBadge(sub.status)}</div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 scholarly-heading">
                      {sub.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {sub.abstract}
                    </p>
                  </div>

                  {/* Decision Banner if present */}
                  {latestDecision && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Editorial Decision: {latestDecision.decision.replace('_', ' ')}</span>
                      </div>
                      <p className="text-slate-600 italic">
                        &ldquo;{latestDecision.commentsToAuthor || latestDecision.rationale}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center space-x-3 text-slate-500">
                      <span>Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Draft'}</span>
                      {sub.doiRecord && sub.doiRecord.doi && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-blue-700 font-semibold">
                            DOI: {sub.doiRecord.doi}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {primaryFile && (
                        <a
                          href={`/api/files/download/${primaryFile.id}`}
                          className="inline-flex items-center space-x-1 py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-medium transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download DOCX</span>
                        </a>
                      )}

                      {sub.status === 'REVISIONS_REQUESTED' && (
                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setRevisionModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 py-1.5 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium transition-colors shadow-sm"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Submit Revision</span>
                        </button>
                      )}

                      {sub.status === 'PUBLISHED' && sub.publishedArticle && (
                        <Link
                          href={`/articles/${sub.publishedArticle.id || sub.id}`}
                          className="inline-flex items-center space-x-1 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium transition-colors"
                        >
                          <span>View Published Article</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revision Upload Modal */}
      {revisionModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Submit Revised Manuscript ({selectedSub.submissionNumber})
              </h3>
              <button
                onClick={() => setRevisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadRevisionSubmit} className="p-6 space-y-4 text-xs">
              {revisionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded">
                  {revisionError}
                </div>
              )}
              {revisionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded">
                  {revisionSuccess}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Upload Revised Word Document (.docx) *
                </label>
                <input
                  type="file"
                  required
                  accept=".docx,.doc"
                  onChange={(e) => setRevisionFile(e.target.files?.[0] || null)}
                  className="w-full py-1 text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Response to Reviewers & Editor Notes *
                </label>
                <textarea
                  rows={4}
                  required
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Provide point-by-point responses addressing reviewer comments and detail the changes made..."
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revisionUploading || !revisionFile || !responseNotes}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {revisionUploading ? 'Submitting...' : 'Submit Revision Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
