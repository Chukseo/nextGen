'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Users,
  BookOpen,
  FileText,
  Award,
  Activity,
  UserPlus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X,
  ExternalLink,
  Lock,
  Plus
} from 'lucide-react';

export default function AdminDashboardClient({
  metrics,
  users,
  journals,
  doiRecords,
  auditEvents,
}: {
  metrics: any;
  users: any[];
  journals: any[];
  doiRecords: any[];
  auditEvents: any[];
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'journals' | 'doi' | 'audit'>('overview');

  // User modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('EDITOR');
  const [newUserJournalId, setNewUserJournalId] = useState(journals[0]?.id || '');
  const [newUserAffiliation, setNewUserAffiliation] = useState('');

  // Journal modal
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [journalSlug, setJournalSlug] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [journalAbbr, setJournalAbbr] = useState('');
  const [journalDesc, setJournalDesc] = useState('');
  const [journalEmail, setJournalEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
          journalId: newUserJournalId || undefined,
          affiliation: newUserAffiliation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setFeedback({ type: 'success', text: `User ${newUserEmail} successfully provisioned.` });
      setUserModalOpen(false);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isActive: !currentActive,
        }),
      });
      if (!res.ok) throw new Error('Status update failed');
      window.location.reload();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: journalSlug,
          title: journalTitle,
          abbreviation: journalAbbr,
          description: journalDesc,
          contactEmail: journalEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create journal');

      setFeedback({ type: 'success', text: `Journal "${journalTitle}" created successfully.` });
      setJournalModalOpen(false);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryDoi = async (submissionId: string) => {
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/submissions/${submissionId}/doi`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'DOI retry failed');

      setFeedback({ type: data.success ? 'success' : 'error', text: data.message });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        {[
          { key: 'overview', label: 'Platform Overview' },
          { key: 'users', label: `Users & Roles (${users.length})` },
          { key: 'journals', label: `Journals (${journals.length})` },
          { key: 'doi', label: `Crossref DOI Subsystem (${doiRecords.length})` },
          { key: 'audit', label: `Security Audit Logs (${auditEvents.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
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

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Journals</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalJournals}</div>
              <span className="text-[10px] text-slate-400">Independent mastheads</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Registered Users</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalUsers}</div>
              <span className="text-[10px] text-slate-400">Scholars & staff</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Submissions</span>
              <div className="text-2xl font-bold text-blue-700 mt-1">{metrics.totalSubmissions}</div>
              <span className="text-[10px] text-slate-400">All workflow stages</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Published Articles</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.publishedCount}</div>
              <span className="text-[10px] text-emerald-700 font-semibold">Open Access Live</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Awaiting Screening</span>
              <div className="text-xl font-bold text-amber-700 mt-1">{metrics.awaitingScreening}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">In Peer Review</span>
              <div className="text-xl font-bold text-blue-700 mt-1">{metrics.underReview}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Crossref Registered</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{metrics.doiRegisteredCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">DOI Pending / Failed</span>
              <div className="text-xl font-bold text-rose-700 mt-1">{metrics.doiFailedCount}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Master Administrative Operations
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setUserModalOpen(true)}
                className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite / Create Scholar Account</span>
              </button>

              <button
                onClick={() => setJournalModalOpen(true)}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Launch New Journal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USERS & ROLES TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Platform Accounts & Role Assignments
            </h3>
            <button
              onClick={() => setUserModalOpen(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-3 py-1.5 rounded transition-colors flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Name & Email</th>
                    <th className="py-3 px-4">Roles & Scopes</th>
                    <th className="py-3 px-4">Affiliation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name || 'Scholar'}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roleAssignments.map((ra: any, idx: number) => (
                            <span
                              key={idx}
                              className="bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-1.5 py-0.5 rounded text-[10px]"
                            >
                              {ra.role}
                              {ra.journal ? ` (${ra.journal.slug})` : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.affiliation || 'Unspecified'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                          className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                            u.isActive
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* JOURNALS TAB */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Publishing Organization Journals
            </h3>
            <button
              onClick={() => setJournalModalOpen(true)}
              className="bg-navy-900 hover:bg-navy-950 text-white font-semibold text-xs px-3 py-1.5 rounded transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Journal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {journals.map((j) => (
              <div key={j.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs bg-navy-900 text-white px-2 py-0.5 rounded">
                    {j.slug.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">{j.abbreviation}</span>
                </div>

                <h4 className="text-base font-bold text-slate-900 scholarly-heading">
                  {j.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-3">
                  {j.description}
                </p>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div><strong>Print ISSN:</strong> {j.printIssn || 'N/A'}</div>
                  <div><strong>Online ISSN:</strong> {j.onlineIssn || 'N/A'}</div>
                  <div><strong>Contact:</strong> {j.contactEmail}</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <Link href={`/journals/${j.slug}`} className="text-blue-700 font-semibold hover:underline">
                    Public View
                  </Link>
                  <span className="text-slate-400">Active Masthead</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOI CROSSREF REGISTRY TAB */}
      {activeTab === 'doi' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Crossref DOI Registration Registry
            </h3>
            <p className="text-xs text-slate-500">
              Official records of persistent identifiers deposited to Crossref schema with retry controls.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Submission Ref</th>
                  <th className="py-3 px-4">Assigned DOI</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Deposit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doiRecords.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {d.submission?.submissionNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`https://doi.org/${d.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-blue-700 hover:underline flex items-center space-x-1"
                      >
                        <span>{d.doi}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          d.status === 'REGISTERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {d.registeredAt ? new Date(d.registeredAt).toLocaleString() : 'Pending'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.submissionId && (
                        <button
                          onClick={() => handleRetryDoi(d.submissionId)}
                          disabled={loading}
                          className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1 ml-auto"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry Deposit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Immutable Platform Security Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Tracks administrative provisioning, editorial decisions, reviewer assignments, and DOI deposits.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {auditEvents.map((evt) => (
                <div key={evt.id} className="p-4 hover:bg-slate-50/50 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-slate-900 font-mono">{evt.action}</span>
                    <span>{new Date(evt.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-600">
                    <span>Actor: <strong>{evt.user?.name || evt.user?.email || 'System'}</strong></span>
                    <span className="mx-2">•</span>
                    <span>Entity: <strong>{evt.entityType}</strong></span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 overflow-x-auto">
                    {evt.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USER PROVISIONING MODAL */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Provision Academic Account</h3>
              <button onClick={() => setUserModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="scholar@university.edu"
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Prof. Jane Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                >
                  <option value="EDITOR">Journal Editor</option>
                  <option value="JOURNAL_MANAGER">Journal Manager</option>
                  <option value="REVIEWER">Peer Reviewer</option>
                  <option value="AUTHOR">Author</option>
                  <option value="MASTER_ADMIN">Master Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Scope to Journal (Optional)</label>
                <select
                  value={newUserJournalId}
                  onChange={(e) => setNewUserJournalId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                >
                  <option value="">-- All Journals (Global) --</option>
                  {journals.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Affiliation</label>
                <input
                  type="text"
                  value={newUserAffiliation}
                  onChange={(e) => setNewUserAffiliation(e.target.value)}
                  placeholder="e.g. Oxford University"
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-navy-900 hover:bg-navy-950 text-white font-semibold px-5 py-2 rounded transition-colors"
                >
                  {loading ? 'Creating...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOURNAL CREATION MODAL */}
      {journalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Launch New Academic Journal</h3>
              <button onClick={() => setJournalModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateJournal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Journal Slug * (URL identifier)</label>
                <input
                  type="text"
                  required
                  value={journalSlug}
                  onChange={(e) => setJournalSlug(e.target.value)}
                  placeholder="e.g. ai-ethics"
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Journal Title *</label>
                <input
                  type="text"
                  required
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  placeholder="Journal of AI Ethics & Governance"
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Abbreviation</label>
                <input
                  type="text"
                  value={journalAbbr}
                  onChange={(e) => setJournalAbbr(e.target.value)}
                  placeholder="J. AI Ethics Gov."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Editorial Contact Email *</label>
                <input
                  type="email"
                  required
                  value={journalEmail}
                  onChange={(e) => setJournalEmail(e.target.value)}
                  placeholder="aiethics-editorial@nextgen-press.org"
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Short Description & Aims</label>
                <textarea
                  rows={3}
                  value={journalDesc}
                  onChange={(e) => setJournalDesc(e.target.value)}
                  placeholder="Covers foundational and societal aspects of artificial intelligence..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setJournalModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-navy-900 hover:bg-navy-950 text-white font-semibold px-5 py-2 rounded transition-colors"
                >
                  {loading ? 'Creating...' : 'Launch Journal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
