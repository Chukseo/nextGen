'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  FileText,
  Clock,
  Download,
  Send,
  AlertCircle,
  Shield,
  X,
  Star
} from 'lucide-react';
import { ReviewRecommendation } from '@/types';

export default function ReviewerDashboardClient({ assignments }: { assignments: any[] }) {
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Form
  const [recommendation, setRecommendation] = useState<ReviewRecommendation>('ACCEPT');
  const [rating, setRating] = useState(4);
  const [commentsForAuthors, setCommentsForAuthors] = useState('');
  const [confidentialComments, setConfidentialComments] = useState('');
  const [coiDeclared, setCoiDeclared] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/submissions/${selectedAssignment.submissionId}/review-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation,
          rating,
          commentsForAuthors,
          confidentialCommentsForEditors: confidentialComments,
          conflictOfInterestDeclared: coiDeclared,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setFeedback({ type: 'success', text: data.message });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
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

      {/* Review Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 scholarly-heading">
            Your Assigned Manuscripts
          </h2>
          <p className="text-xs text-slate-500">
            Review manuscripts anonymously and provide constructive technical assessments for editors.
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p>You have no pending manuscript review assignments.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment) => {
              const sub = assignment.submission;
              const primaryFile = sub.files?.[0];
              const isCompleted = assignment.status === 'COMPLETED';

              return (
                <div key={assignment.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {sub.submissionNumber}
                      </span>
                      <span className="font-semibold text-slate-600">
                        {sub.journal?.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 scholarly-heading">
                      {sub.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {sub.abstract}
                    </p>
                  </div>

                  {/* Review Guidelines Notice */}
                  <div className="text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center space-x-3">
                      <span>Due: <strong>{new Date(assignment.dueDate).toLocaleDateString()}</strong></span>
                      <span>•</span>
                      <span>Track: <strong>{sub.reviewModel.replace('_', ' ')}</strong></span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {primaryFile && (
                        <a
                          href={`/api/files/download/${primaryFile.id}`}
                          className="text-xs font-semibold text-blue-700 hover:underline flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Blinded Manuscript DOCX</span>
                        </a>
                      )}

                      {!isCompleted ? (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setReportModalOpen(true);
                          }}
                          className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs px-4 py-2 rounded shadow transition-colors"
                        >
                          Submit Review Report
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-xs flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Report Submitted ({assignment.report?.recommendation.replace('_', ' ')})</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Structured Review Report Modal */}
      {reportModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Peer Review Report ({selectedAssignment.submission.submissionNumber})
              </h3>
              <button onClick={() => setReportModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Overall Recommendation *
                </label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value as ReviewRecommendation)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-semibold text-slate-900 outline-none"
                >
                  <option value="ACCEPT">Accept (As is or with minor polishing)</option>
                  <option value="MINOR_REVISION">Minor Revision (Address specific technical points)</option>
                  <option value="MAJOR_REVISION">Major Revision (Substantial reworking required)</option>
                  <option value="REJECT">Reject (Fundamental flaws or out of scope)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Technical Quality Rating (1 to 5)
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                >
                  <option value={5}>5 - Outstanding (Highest technical rigour)</option>
                  <option value={4}>4 - Good (Rigorous with solid contributions)</option>
                  <option value={3}>3 - Acceptable (Meets baseline standards)</option>
                  <option value={2}>2 - Marginal (Significant weaknesses)</option>
                  <option value={1}>1 - Unacceptable</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Constructive Comments for Authors *
                </label>
                <textarea
                  rows={4}
                  required
                  value={commentsForAuthors}
                  onChange={(e) => setCommentsForAuthors(e.target.value)}
                  placeholder="Detail strengths, methodology evaluation, clarity of presentation, and actionable recommendations..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Confidential Comments for Editor (Not disclosed to authors)
                </label>
                <textarea
                  rows={2}
                  value={confidentialComments}
                  onChange={(e) => setConfidentialComments(e.target.value)}
                  placeholder="Any ethical concerns, potential overlaps, or frank advice for the editor..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="coi"
                  checked={coiDeclared}
                  onChange={(e) => setCoiDeclared(e.target.checked)}
                  className="rounded text-blue-700"
                />
                <label htmlFor="coi" className="text-slate-700 font-medium">
                  I certify that I have no competing financial or personal conflict of interest regarding this manuscript.
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !commentsForAuthors}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Official Review Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
