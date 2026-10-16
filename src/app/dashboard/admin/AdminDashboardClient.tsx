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
  Plus,
  Trash2,
  UserCog,
  ShieldCheck,
  Edit3,
  Image as ImageIcon,
} from 'lucide-react';

export default function AdminDashboardClient({
  metrics,
  users,
  journals,
  doiRecords,
  auditEvents,
  currentUser,
}: {
  metrics: any;
  users: any[];
  journals: any[];
  doiRecords: any[];
  auditEvents: any[];
  currentUser?: any;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'journals' | 'doi' | 'audit'>('overview');

  // User modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('EDITOR');
  const [newUserJournalId, setNewUserJournalId] = useState(journals[0]?.id || '');
  const [newUserAffiliation, setNewUserAffiliation] = useState('');

  // Role management modal
  const [rolesModalUser, setRolesModalUser] = useState<any | null>(null);
  const [addRoleType, setAddRoleType] = useState('REVIEWER');
  const [addRoleJournalId, setAddRoleJournalId] = useState('');

  // Delete user modal
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any | null>(null);

  // Journal modal
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [journalSlug, setJournalSlug] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [journalAbbr, setJournalAbbr] = useState('');
  const [journalDesc, setJournalDesc] = useState('');
  const [journalEmail, setJournalEmail] = useState('');
  const [journalCoverFile, setJournalCoverFile] = useState<File | null>(null);

  // Edit Journal state
  const [editJournalModalOpen, setEditJournalModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<any | null>(null);
  const [editJournalTitle, setEditJournalTitle] = useState('');
  const [editJournalAbbr, setEditJournalAbbr] = useState('');
  const [editJournalDesc, setEditJournalDesc] = useState('');
  const [editJournalAims, setEditJournalAims] = useState('');
  const [editJournalPrintIssn, setEditJournalPrintIssn] = useState('');
  const [editJournalOnlineIssn, setEditJournalOnlineIssn] = useState('');
  const [editJournalEmail, setEditJournalEmail] = useState('');
  const [editJournalCoverFile, setEditJournalCoverFile] = useState<File | null>(null);
  const [editJournalExistingCoverUrl, setEditJournalExistingCoverUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRemoveRole = async (userId: string, roleAssignmentId: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, removeRoleId: roleAssignmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove role');

      setFeedback({ type: 'success', text: 'Role removed successfully.' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolesModalUser) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: rolesModalUser.id,
          newRole: addRoleType,
          journalId: addRoleJournalId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add role');

      setFeedback({ type: 'success', text: `Role ${addRoleType} assigned successfully.` });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteConfirmUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      setFeedback({ type: 'success', text: data.message || 'User deleted successfully.' });
      setDeleteConfirmUser(null);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

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

  const openEditJournalModal = (j: any) => {
    setEditingJournal(j);
    setEditJournalTitle(j.title || '');
    setEditJournalAbbr(j.abbreviation || '');
    setEditJournalDesc(j.description || '');
    setEditJournalAims(j.aimsScope || '');
    setEditJournalPrintIssn(j.printIssn || '');
    setEditJournalOnlineIssn(j.onlineIssn || '');
    setEditJournalEmail(j.contactEmail || '');
    setEditJournalExistingCoverUrl(j.coverImageUrl || '');
    setEditJournalCoverFile(null);
    setEditJournalModalOpen(true);
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      let resolvedCoverUrl: string | undefined = undefined;
      if (journalCoverFile) {
        const formData = new FormData();
        formData.append('file', journalCoverFile);
        formData.append('bucket', 'published-articles');
        const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload journal cover image');
        resolvedCoverUrl = uploadData.publicUrl || uploadData.storageUrl || `/storage/${uploadData.storageKey}`;
      }

      const res = await fetch('/api/admin/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: journalSlug,
          title: journalTitle,
          abbreviation: journalAbbr,
          description: journalDesc,
          contactEmail: journalEmail,
          coverImageUrl: resolvedCoverUrl || undefined,
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

  const handleEditJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJournal) return;
    setLoading(true);
    setFeedback(null);

    try {
      let resolvedCoverUrl = editJournalExistingCoverUrl;
      if (editJournalCoverFile) {
        const formData = new FormData();
        formData.append('file', editJournalCoverFile);
        formData.append('bucket', 'published-articles');
        const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload cover image');
        resolvedCoverUrl = uploadData.publicUrl || uploadData.storageUrl || `/storage/${uploadData.storageKey}`;
      }

      const res = await fetch(`/api/admin/journals/${editingJournal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editJournalTitle,
          abbreviation: editJournalAbbr,
          description: editJournalDesc,
          aimsScope: editJournalAims,
          printIssn: editJournalPrintIssn,
          onlineIssn: editJournalOnlineIssn,
          contactEmail: editJournalEmail,
          coverImageUrl: resolvedCoverUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update journal');

      setFeedback({ type: 'success', text: `Journal "${editJournalTitle}" updated successfully!` });
      setEditJournalModalOpen(false);
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
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setRolesModalUser(u);
                              setAddRoleType('REVIEWER');
                              setAddRoleJournalId('');
                            }}
                            className="text-[11px] font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center space-x-1"
                            title="Manage and change roles"
                          >
                            <UserCog className="w-3 h-3" />
                            <span>Roles</span>
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                            disabled={currentUser?.id === u.id}
                            className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.isActive
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            disabled={currentUser?.id === u.id}
                            className="text-[11px] font-semibold px-2 py-1 rounded text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-0.5"
                            title={currentUser?.id === u.id ? "Cannot delete your own admin account" : "Delete user account"}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
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
              <div key={j.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between overflow-hidden">
                <div className="space-y-3">
                  {j.coverImageUrl && (
                    <div className="relative h-36 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={j.coverImageUrl}
                        alt={j.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs bg-navy-900 text-white px-2 py-0.5 rounded">
                      {j.slug.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{j.abbreviation}</span>
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
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <Link href={`/journals/${j.slug}`} className="text-blue-700 font-semibold hover:underline">
                    Public View
                  </Link>
                  <button
                    onClick={() => openEditJournalModal(j)}
                    className="inline-flex items-center space-x-1 py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit Journal & Cover</span>
                  </button>
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

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Journal Cover Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setJournalCoverFile(e.target.files?.[0] || null)}
                  className="w-full py-1 text-slate-700 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  High-resolution front cover artwork (.png, .jpg, .webp). Displayed in the catalog and journal masthead.
                </p>
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

      {/* EDIT JOURNAL & COVER MODAL */}
      {editJournalModalOpen && editingJournal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Journal & Cover Image</h3>
                <p className="text-[11px] text-slate-500">{editingJournal.slug.toUpperCase()} &bull; {editingJournal.title}</p>
              </div>
              <button onClick={() => setEditJournalModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleEditJournalSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Journal Title *</label>
                <input
                  type="text"
                  required
                  value={editJournalTitle}
                  onChange={(e) => setEditJournalTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Abbreviation</label>
                  <input
                    type="text"
                    value={editJournalAbbr}
                    onChange={(e) => setEditJournalAbbr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Editorial Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={editJournalEmail}
                    onChange={(e) => setEditJournalEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Print ISSN</label>
                  <input
                    type="text"
                    value={editJournalPrintIssn}
                    onChange={(e) => setEditJournalPrintIssn(e.target.value)}
                    placeholder="e.g. 2999-1234"
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Online ISSN</label>
                  <input
                    type="text"
                    value={editJournalOnlineIssn}
                    onChange={(e) => setEditJournalOnlineIssn(e.target.value)}
                    placeholder="e.g. 2999-5678"
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              {/* Cover Image Upload & Current Preview */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block font-bold text-slate-700 uppercase text-[11px]">
                  Journal Cover Artwork
                </label>
                {editJournalExistingCoverUrl && (
                  <div className="relative h-28 w-20 rounded border border-slate-300 overflow-hidden shadow-xs bg-white">
                    <img
                      src={editJournalExistingCoverUrl}
                      alt="Current Journal Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditJournalCoverFile(e.target.files?.[0] || null)}
                  className="w-full py-1 text-slate-700 text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  Select a new image (.png, .jpg, .webp) to update or replace the journal cover artwork.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editJournalDesc}
                  onChange={(e) => setEditJournalDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Aims and Scope</label>
                <textarea
                  rows={3}
                  value={editJournalAims}
                  onChange={(e) => setEditJournalAims(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditJournalModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !editJournalTitle}
                  className="bg-navy-900 hover:bg-navy-950 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Journal Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE USER ROLES MODAL */}
      {rolesModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <UserCog className="w-4 h-4 text-blue-700" />
                  <span>Manage Roles: {rolesModalUser.name || 'Scholar'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{rolesModalUser.email}</p>
              </div>
              <button
                onClick={() => setRolesModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              {/* Existing Roles */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase text-[11px]">
                  Assigned Roles ({rolesModalUser.roleAssignments?.length || 0})
                </label>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                  {rolesModalUser.roleAssignments?.length === 0 ? (
                    <div className="p-3 text-slate-500 italic text-center">No roles assigned.</div>
                  ) : (
                    rolesModalUser.roleAssignments.map((ra: any) => {
                      const isSelfMasterAdmin = currentUser?.id === rolesModalUser.id && ra.role === 'MASTER_ADMIN';
                      return (
                        <div key={ra.id} className="p-3 flex items-center justify-between gap-2 bg-white">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                  ra.role === 'MASTER_ADMIN'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : ra.role === 'JOURNAL_MANAGER'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : ra.role === 'EDITOR'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                    : ra.role === 'REVIEWER'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                {ra.role}
                              </span>
                              <span className="text-slate-600 text-[11px]">
                                {ra.journal ? (
                                  <span>Journal: <strong>{ra.journal.title}</strong> ({ra.journal.slug})</span>
                                ) : (
                                  <span className="text-slate-400">Global / All Journals</span>
                                )}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveRole(rolesModalUser.id, ra.id)}
                            disabled={loading || isSelfMasterAdmin}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors text-[11px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1"
                            title={isSelfMasterAdmin ? 'Cannot remove your own Master Admin role' : 'Remove this role assignment'}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Add New Role */}
              <form onSubmit={handleAddRole} className="p-4 border border-blue-200 rounded-lg bg-blue-50/40 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-700" />
                  <span>Assign Additional Role</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Role *</label>
                    <select
                      value={addRoleType}
                      onChange={(e) => setAddRoleType(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none font-medium text-slate-800"
                    >
                      <option value="AUTHOR">Author</option>
                      <option value="REVIEWER">Peer Reviewer</option>
                      <option value="EDITOR">Journal Editor</option>
                      <option value="SECTION_EDITOR">Section Editor</option>
                      <option value="JOURNAL_MANAGER">Journal Manager</option>
                      <option value="MASTER_ADMIN">Master Administrator</option>
                      <option value="READER">Reader</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Scope to Journal (Optional)</label>
                    <select
                      value={addRoleJournalId}
                      onChange={(e) => setAddRoleJournalId(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none text-slate-800"
                    >
                      <option value="">-- All Journals (Global) --</option>
                      {journals.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.abbreviation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-1.5 rounded transition-colors text-xs flex items-center space-x-1 shadow-sm disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{loading ? 'Adding...' : 'Add Role'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setRolesModalUser(null)}
                className="px-4 py-2 border border-slate-300 rounded text-slate-700 text-xs font-semibold hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE USER MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-rose-200 max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50">
              <h3 className="font-bold text-rose-900 text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Permanently Delete User</span>
              </h3>
              <button onClick={() => setDeleteConfirmUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              <p>
                Are you sure you want to permanently delete the account for:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{deleteConfirmUser.name || 'Scholar'}</div>
                <div className="font-mono text-slate-600 text-[11px]">{deleteConfirmUser.email}</div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Affiliation: <strong>{deleteConfirmUser.affiliation || 'None'}</strong>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Permanent Deletion Warning</span>
                </div>
                <p>
                  This user will be permanently deleted along with all assigned roles, sessions, authored submissions, and review reports. This operation cannot be reversed.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={loading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{loading ? 'Deleting...' : 'Permanently Delete User'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
