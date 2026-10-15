'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  UploadCloud,
  Layers,
  Award,
  ExternalLink,
  ChevronDown,
  X,
  Plus,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';

export default function EditorDashboardClient({
  submissions,
  journals,
  reviewers,
  issues,
  currentUser,
}: {
  submissions: any[];
  journals: any[];
  reviewers: any[];
  issues: any[];
  currentUser: any;
}) {
  const [activeTab, setActiveTab] = useState<'screening' | 'review' | 'revisions' | 'production' | 'all'>('screening');
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  // Modals
  const [assignReviewerModalOpen, setAssignReviewerModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [doiModalOpen, setDoiModalOpen] = useState(false);

  // Form states
  const [reviewerId, setReviewerId] = useState(reviewers[0]?.id || '');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [dueDays, setDueDays] = useState(21);

  const [decisionType, setDecisionType] = useState('ACCEPT');
  const [rationale, setRationale] = useState('');
  const [commentsToAuthor, setCommentsToAuthor] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [selectedIssueId, setSelectedIssueId] = useState(issues[0]?.id || '');
  const [articleNumber, setArticleNumber] = useState('003');
  const [pageRange, setPageRange] = useState('32-48');

  // Loading & feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filterSubmissions = () => {
    switch (activeTab) {
      case 'screening':
        return submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'INITIAL_SCREENING' || s.status === 'EDITOR_ASSIGNED');
      case 'review':
        return submissions.filter((s) => s.status === 'UNDER_REVIEW');
      case 'revisions':
        return submissions.filter((s) => s.status === 'REVISIONS_REQUESTED' || s.status === 'REVISION_SUBMITTED');
      case 'production':
        return submissions.filter((s) => s.status === 'ACCEPTED' || s.status === 'COPYEDITING' || s.status === 'PRODUCTION');
      case 'all':
      default:
        return submissions;
    }
  };

  const currentList = filterSubmissions();

  const handleAssignReviewerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/submissions/${selectedSub.id}/assign-reviewer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: reviewerId || undefined,
          reviewerEmail: reviewerEmail || undefined,
          dueDateDays: dueDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign reviewer');

      setFeedback({ type: 'success', text: data.message });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/submissions/${selectedSub.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionType,
          rationale,
          commentsToAuthor,
          internalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record decision');

      setFeedback({ type: 'success', text: data.message });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !selectedIssueId) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const primaryFile = selectedSub.files?.[0];
      const res = await fetch(`/api/issues/${selectedIssueId}/publish-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          articleNumber,
          pageRange,
          pdfStorageKey: primaryFile?.storageKey || `published/${selectedSub.submissionNumber}.pdf`,
          pdfUrl: primaryFile?.storageUrl || `/storage/published/${selectedSub.submissionNumber}.pdf`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish article');

      setFeedback({ type: 'success', text: data.message });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerDOI = async (subId: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/submissions/${subId}/doi`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register DOI');

      setFeedback({
        type: data.success ? 'success' : 'error',
        text: data.message,
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('screening')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'screening'
              ? 'bg-blue-50 border-blue-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Desk Screening</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'INITIAL_SCREENING').length}
          </span>
          <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Awaiting Check</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'review'
              ? 'bg-blue-50 border-blue-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Under Review</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">
            {submissions.filter((s) => s.status === 'UNDER_REVIEW').length}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Active Peer Reviews</span>
        </button>

        <button
          onClick={() => setActiveTab('revisions')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'revisions'
              ? 'bg-blue-50 border-blue-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Revisions</span>
          <span className="text-2xl font-bold text-purple-700 mt-1 block">
            {submissions.filter((s) => s.status === 'REVISIONS_REQUESTED' || s.status === 'REVISION_SUBMITTED').length}
          </span>
          <span className="text-[10px] text-purple-700 font-semibold mt-0.5 block">Author Response</span>
        </button>

        <button
          onClick={() => setActiveTab('production')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'production'
              ? 'bg-blue-50 border-blue-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Production</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            {submissions.filter((s) => s.status === 'ACCEPTED').length}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Ready for Issue</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-lg text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workflow Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 bg-slate-50">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Editorial Workflow Queue:
            </h2>
            <span className="text-xs bg-navy-900 text-white font-bold px-2 py-0.5 rounded">
              {activeTab.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Submissions ({submissions.length})
            </button>
          </div>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No manuscripts currently in this workflow stage.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentList.map((sub) => {
              const primaryFile = sub.files?.[0];
              const reviews = sub.reviewAssignments || [];
              const latestDecision = sub.editorialDecisions?.[0];

              return (
                <div key={sub.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {sub.submissionNumber}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {sub.journal?.abbreviation}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        {sub.articleType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">
                        {sub.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 scholarly-heading">
                      {sub.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Authors: {sub.coAuthors.map((a: any) => `${a.firstName} ${a.lastName} (${a.affiliation})`).join('; ')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {sub.abstract}
                    </p>
                  </div>

                  {/* Review Assignments Status */}
                  {reviews.length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                      <span className="font-bold text-slate-700 uppercase tracking-wider block">
                        Assigned Reviewers ({reviews.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {reviews.map((r: any) => (
                          <div key={r.id} className="bg-white p-2 rounded border border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-slate-900">{r.reviewer?.name || 'Reviewer'}</span>
                              <span className="text-[10px] text-slate-500 block">Due: {new Date(r.dueDate).toLocaleDateString()}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
                    <div className="flex items-center space-x-3 text-slate-500">
                      {primaryFile && (
                        <a
                          href={`/api/files/download/${primaryFile.id}`}
                          className="text-blue-700 hover:underline font-semibold flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Manuscript DOCX</span>
                        </a>
                      )}
                      <span>Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Draft'}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Assign Reviewer Button */}
                      {(sub.status === 'SUBMITTED' || sub.status === 'INITIAL_SCREENING' || sub.status === 'UNDER_REVIEW' || sub.status === 'REVISION_SUBMITTED') && (
                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setAssignReviewerModalOpen(true);
                          }}
                          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold px-3 py-1.5 rounded transition-colors shadow-sm"
                        >
                          Assign Reviewer
                        </button>
                      )}

                      {/* Editorial Decision Button */}
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setDecisionModalOpen(true);
                        }}
                        className="bg-navy-900 hover:bg-navy-950 text-white font-semibold px-3 py-1.5 rounded transition-colors shadow-sm"
                      >
                        Record Decision
                      </button>

                      {/* Publish in Issue Button */}
                      {(sub.status === 'ACCEPTED' || sub.status === 'PRODUCTION') && (
                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setPublishModalOpen(true);
                          }}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded transition-colors shadow-sm flex items-center space-x-1"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Publish in Issue</span>
                        </button>
                      )}

                      {/* Crossref DOI Deposit Trigger */}
                      {sub.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleTriggerDOI(sub.id)}
                          disabled={actionLoading}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-semibold px-3 py-1.5 rounded transition-colors flex items-center space-x-1"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{sub.doiRecord?.status === 'REGISTERED' ? 'Crossref Verified' : 'Deposit Crossref DOI'}</span>
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

      {/* ASSIGN REVIEWER MODAL */}
      {assignReviewerModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Assign Reviewer ({selectedSub.submissionNumber})
              </h3>
              <button onClick={() => setAssignReviewerModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAssignReviewerSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Select Existing Scholar from Reviewer Pool
                </label>
                <select
                  value={reviewerId}
                  onChange={(e) => {
                    setReviewerId(e.target.value);
                    setReviewerEmail('');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">-- Choose Reviewer --</option>
                  {reviewers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.affiliation || r.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 block text-center my-1 uppercase font-semibold">Or Invite by Email</span>
                <input
                  type="email"
                  value={reviewerEmail}
                  onChange={(e) => {
                    setReviewerEmail(e.target.value);
                    setReviewerId('');
                  }}
                  placeholder="reviewer@academic-institution.edu"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Review Response Deadline (Days)
                </label>
                <input
                  type="number"
                  min={7}
                  max={60}
                  value={dueDays}
                  onChange={(e) => setDueDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignReviewerModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (!reviewerId && !reviewerEmail)}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Assigning...' : 'Dispatch Review Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD EDITORIAL DECISION MODAL */}
      {decisionModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Record Editorial Decision ({selectedSub.submissionNumber})
              </h3>
              <button onClick={() => setDecisionModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Decision Recommendation *
                </label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-800"
                >
                  <option value="ACCEPT">Accept for Publication</option>
                  <option value="MINOR_REVISION">Request Minor Revisions</option>
                  <option value="MAJOR_REVISION">Request Major Revisions</option>
                  <option value="REJECT">Reject Manuscript</option>
                  <option value="DESK_REJECT">Desk Reject (Out of Scope)</option>
                  <option value="SEND_TO_REVIEW">Move to Peer Review</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Editorial Rationale (Internal & Audit Record) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Record justification based on scope, technical rigour, and reviewer reports..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Comments to Author (Included in Official Notification)
                </label>
                <textarea
                  rows={3}
                  value={commentsToAuthor}
                  onChange={(e) => setCommentsToAuthor(e.target.value)}
                  placeholder="Guidance for authors or congratulatory acceptance letter..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rationale}
                  className="bg-navy-900 hover:bg-navy-950 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Record & Notify Author'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH ARTICLE IN ISSUE MODAL */}
      {publishModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Publish Accepted Article ({selectedSub.submissionNumber})
              </h3>
              <button onClick={() => setPublishModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Select Destination Issue *
                </label>
                <select
                  value={selectedIssueId}
                  onChange={(e) => setSelectedIssueId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  {issues.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.journal?.abbreviation} - Vol. {i.volume?.volumeNumber || 1}, Iss. {i.issueNumber} ({i.year}) - {i.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Article Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={articleNumber}
                    onChange={(e) => setArticleNumber(e.target.value)}
                    placeholder="001"
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Page Range *
                  </label>
                  <input
                    type="text"
                    required
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="1-16"
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900">
                <p className="leading-relaxed">
                  Publishing will generate persistent bibliographic citations, assign Crossref DOI metadata, and make the article publicly discoverable on the library catalog.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Publishing...' : 'Approve & Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
