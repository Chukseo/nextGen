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
  X,
  Edit3,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';

export default function AuthorDashboardClient({ submissions }: { submissions: any[] }) {
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  // Re-upload / Revision Modal State
  const [reuploadModalOpen, setReuploadModalOpen] = useState(false);
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);
  const [reuploadNotes, setReuploadNotes] = useState('');
  const [reuploadUploading, setReuploadUploading] = useState(false);
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const [reuploadSuccess, setReuploadSuccess] = useState<string | null>(null);

  // Edit Submission Details Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editAbstract, setEditAbstract] = useState('');
  const [editDiscipline, setEditDiscipline] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [editFundingInfo, setEditFundingInfo] = useState('');
  const [editCoi, setEditCoi] = useState('');
  const [editDataAvailability, setEditDataAvailability] = useState('');
  const [editEthics, setEditEthics] = useState('');
  const [editAcknowledgements, setEditAcknowledgements] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

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
      case 'PRODUCTION':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-bold">In Production</span>;
      case 'PUBLISHED':
        return <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded font-bold">Published</span>;
      case 'REJECTED':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded font-bold">Declined</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded font-bold">{status}</span>;
    }
  };

  const openEditModal = (sub: any) => {
    setSelectedSub(sub);
    setEditTitle(sub.title || '');
    setEditSubtitle(sub.subtitle || '');
    setEditAbstract(sub.abstract || '');
    setEditDiscipline(sub.discipline || '');
    setEditKeywords(Array.isArray(sub.keywords) ? sub.keywords.join(', ') : sub.keywords || '');
    setEditFundingInfo(sub.fundingInfo || '');
    setEditCoi(sub.conflictOfInterest || '');
    setEditDataAvailability(sub.dataAvailability || '');
    setEditEthics(sub.ethicsStatement || '');
    setEditAcknowledgements(sub.acknowledgements || '');
    setEditError(null);
    setEditSuccess(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const keywordsArray = editKeywords
        ? editKeywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/submissions/${selectedSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          subtitle: editSubtitle,
          abstract: editAbstract,
          discipline: editDiscipline,
          keywords: keywordsArray,
          fundingInfo: editFundingInfo,
          conflictOfInterest: editCoi,
          dataAvailability: editDataAvailability,
          ethicsStatement: editEthics,
          acknowledgements: editAcknowledgements,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update submission details');

      setEditSuccess('Submission details successfully updated.');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const openReuploadModal = (sub: any) => {
    setSelectedSub(sub);
    setReuploadFile(null);
    setReuploadNotes('');
    setReuploadError(null);
    setReuploadSuccess(null);
    setReuploadModalOpen(true);
  };

  const handleReuploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !reuploadFile) return;

    setReuploadUploading(true);
    setReuploadError(null);
    setReuploadSuccess(null);

    try {
      // 1. Upload new manuscript file
      const formData = new FormData();
      formData.append('file', reuploadFile);
      formData.append('bucket', 'manuscripts-private');

      const uploadRes = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'File upload failed');

      // 2. Submit re-upload request (forces deletion of previous manuscript version)
      const revRes = await fetch(`/api/submissions/${selectedSub.id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedFileKey: uploadData.storageKey,
          uploadedFileName: uploadData.fileName,
          uploadedFileSize: uploadData.fileSize,
          responseToReviewers: reuploadNotes || 'Corrected manuscript uploaded by author.',
        }),
      });
      const revData = await revRes.json();
      if (!revRes.ok) throw new Error(revData.error || 'Manuscript update failed');

      setReuploadSuccess(revData.message || 'Corrected manuscript successfully uploaded. Previous version was replaced.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setReuploadError(err.message);
    } finally {
      setReuploadUploading(false);
    }
  };

  const handleDeleteSubmission = async (sub: any) => {
    if (!window.confirm(`Are you sure you want to delete submission "${sub.submissionNumber} - ${sub.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/submissions/${sub.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete submission');

      alert('Submission successfully deleted.');
      window.location.reload();
    } catch (err: any) {
      alert(`Error deleting submission: ${err.message}`);
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
            {submissions.filter((s) => s.status === 'ACCEPTED' || s.status === 'PRODUCTION' || s.status === 'PUBLISHED').length}
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
            <p className="text-xs text-slate-500">Track editorial reviews, edit details, and upload corrected manuscripts.</p>
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
              const isPreAcceptance = ['SUBMITTED', 'INITIAL_SCREENING', 'UNDER_REVIEW', 'REVISIONS_REQUESTED', 'REVISION_SUBMITTED'].includes(sub.status);
              const canEdit = sub.status !== 'PUBLISHED';

              return (
                <div key={sub.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {sub.submissionNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
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
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
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

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Download Current Manuscript */}
                      {primaryFile && (
                        <a
                          href={`/api/files/download/${primaryFile.id}`}
                          className="inline-flex items-center space-x-1 py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-medium transition-colors"
                          title="Download current manuscript DOCX"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Manuscript DOCX</span>
                        </a>
                      )}

                      {/* Edit Details Button */}
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(sub)}
                          className="inline-flex items-center space-x-1 py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded font-semibold transition-colors shadow-xs"
                          title="Edit submission title, abstract, and declarations"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit Details</span>
                        </button>
                      )}

                      {/* Re-upload Corrected Manuscript Button */}
                      {isPreAcceptance && (
                        <button
                          onClick={() => openReuploadModal(sub)}
                          className={`inline-flex items-center space-x-1 py-1.5 px-3 rounded font-semibold transition-colors shadow-xs ${
                            sub.status === 'REVISIONS_REQUESTED'
                              ? 'bg-purple-700 hover:bg-purple-800 text-white'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300'
                          }`}
                          title="Upload corrected manuscript (replaces previous version)"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{sub.status === 'REVISIONS_REQUESTED' ? 'Submit Revision' : 'Re-upload Manuscript'}</span>
                        </button>
                      )}

                      {/* View Published Article */}
                      {sub.status === 'PUBLISHED' && sub.publishedArticle && (
                        <Link
                          href={`/articles/${sub.publishedArticle.slug || sub.publishedArticle.id || sub.id}`}
                          className="inline-flex items-center space-x-1 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium transition-colors shadow-xs"
                        >
                          <span>View Published Article</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      {/* Delete Submission (if in pre-review/desk screening) */}
                      {(sub.status === 'SUBMITTED' || sub.status === 'INITIAL_SCREENING') && (
                        <button
                          onClick={() => handleDeleteSubmission(sub)}
                          className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Submission"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RE-UPLOAD / REVISION MODAL */}
      {reuploadModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Re-upload Corrected Manuscript ({selectedSub.submissionNumber})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update your manuscript file for the editor and reviewers before acceptance.
                </p>
              </div>
              <button
                onClick={() => setReuploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReuploadSubmit} className="p-6 space-y-4 text-xs">
              {reuploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded">
                  {reuploadError}
                </div>
              )}
              {reuploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded">
                  {reuploadSuccess}
                </div>
              )}

              {/* Single Version Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Single Version Policy:</strong> When you upload this corrected manuscript, your previously uploaded manuscript will be permanently force-deleted from the database so that only one canonical version is maintained at all times.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Corrected Word Document (.docx, .doc) *
                </label>
                <input
                  type="file"
                  required
                  accept=".docx,.doc"
                  onChange={(e) => setReuploadFile(e.target.files?.[0] || null)}
                  className="w-full py-1 text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Correction Notes / Response to Reviewers & Editor
                </label>
                <textarea
                  rows={3}
                  value={reuploadNotes}
                  onChange={(e) => setReuploadNotes(e.target.value)}
                  placeholder="Summarize the corrections made in this file for the editorial team and reviewers..."
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReuploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reuploadUploading || !reuploadFile}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {reuploadUploading ? 'Replacing Manuscript...' : 'Upload & Replace Manuscript'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUBMISSION DETAILS MODAL */}
      {editModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Submission Metadata ({selectedSub.submissionNumber})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update title, abstract, keywords, and ethics declarations for this manuscript.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded">
                  {editSuccess}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Abstract *
                </label>
                <textarea
                  rows={5}
                  required
                  value={editAbstract}
                  onChange={(e) => setEditAbstract(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Discipline / Category
                  </label>
                  <input
                    type="text"
                    value={editDiscipline}
                    onChange={(e) => setEditDiscipline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editKeywords}
                    onChange={(e) => setEditKeywords(e.target.value)}
                    placeholder="e.g. AI, Climate, Energy"
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Funding Information / Grants
                </label>
                <textarea
                  rows={2}
                  value={editFundingInfo}
                  onChange={(e) => setEditFundingInfo(e.target.value)}
                  placeholder="Specify funding sponsors and grant numbers..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Conflict of Interest Declaration
                </label>
                <textarea
                  rows={2}
                  value={editCoi}
                  onChange={(e) => setEditCoi(e.target.value)}
                  placeholder="Declare any competing interests or state 'The authors declare no competing interests'..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Data Availability Statement
                </label>
                <textarea
                  rows={2}
                  value={editDataAvailability}
                  onChange={(e) => setEditDataAvailability(e.target.value)}
                  placeholder="Where can interested readers find the underlying data/code..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !editTitle || !editAbstract}
                  className="bg-navy-900 hover:bg-navy-950 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {editLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
