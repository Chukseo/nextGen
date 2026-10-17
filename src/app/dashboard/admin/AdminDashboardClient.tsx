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
  RotateCcw,
  ArrowRight,
  Eye,
  UploadCloud,
  Star,
  Layers,
  Calendar,
} from 'lucide-react';
import ImportArticleModal from '@/components/ImportArticleModal';
import AdminEditorialBoardModal from '@/components/AdminEditorialBoardModal';
import AdminAuthorGuidelinesModal from '@/components/AdminAuthorGuidelinesModal';

export default function AdminDashboardClient({
  metrics,
  users,
  journals,
  issues = [],
  doiRecords,
  auditEvents,
  publishedArticles,
  productionSubmissions = [],
  currentUser,
}: {
  metrics: any;
  users: any[];
  journals: any[];
  issues?: any[];
  doiRecords: any[];
  auditEvents: any[];
  publishedArticles: any[];
  productionSubmissions?: any[];
  currentUser?: any;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'journals' | 'issues' | 'articles' | 'doi' | 'audit'>('overview');

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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [boardModalJournal, setBoardModalJournal] = useState<any | null>(null);
  const [guidelinesModalJournal, setGuidelinesModalJournal] = useState<any | null>(null);

  // Issue Management state
  const [filterIssueJournalId, setFilterIssueJournalId] = useState('ALL');
  const [createIssueModalOpen, setCreateIssueModalOpen] = useState(false);
  const [editIssueModalOpen, setEditIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any | null>(null);

  // Create issue form
  const [newIssueJournalId, setNewIssueJournalId] = useState(journals[0]?.id || '');
  const [newIssueVolumeNumber, setNewIssueVolumeNumber] = useState(1);
  const [newIssueYear, setNewIssueYear] = useState(new Date().getFullYear());
  const [newIssueNumber, setNewIssueNumber] = useState(1);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDescription, setNewIssueDescription] = useState('');
  const [newIssueStatus, setNewIssueStatus] = useState('DRAFT');
  const [newIssueIsCurrent, setNewIssueIsCurrent] = useState(false);
  const [newIssueScheduledDate, setNewIssueScheduledDate] = useState('');
  const [newIssueEditorialIntro, setNewIssueEditorialIntro] = useState('');
  const [newIssueCoverFile, setNewIssueCoverFile] = useState<File | null>(null);

  // Edit issue form
  const [editIssueTitle, setEditIssueTitle] = useState('');
  const [editIssueNumber, setEditIssueNumber] = useState(1);
  const [editIssueYear, setEditIssueYear] = useState(new Date().getFullYear());
  const [editIssueStatus, setEditIssueStatus] = useState('DRAFT');
  const [editIssueIsCurrent, setEditIssueIsCurrent] = useState(false);
  const [editIssueScheduledDate, setEditIssueScheduledDate] = useState('');
  const [editIssueCoverFile, setEditIssueCoverFile] = useState<File | null>(null);
  const [editIssueExistingCoverUrl, setEditIssueExistingCoverUrl] = useState('');
  const [editIssueDescription, setEditIssueDescription] = useState('');
  const [editIssueEditorialIntro, setEditIssueEditorialIntro] = useState('');

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

  const [articleSearch, setArticleSearch] = useState('');
  const [articlesSubTab, setArticlesSubTab] = useState<'published' | 'production'>('published');

  const handleUnpublishArticle = async (articleId: string) => {
    if (!window.confirm('Unpublish this article? It will be removed from its issue and reverted to the Production stage for re-publishing.')) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/articles/${articleId}/unpublish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unpublish article');
      setFeedback({ type: 'success', text: data.message || 'Article unpublished successfully.' });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRepublishArticle = async (articleId: string) => {
    if (!window.confirm('Re-publish this article? It will be made publicly visible again.')) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/articles/${articleId}/republish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to republish article');
      setFeedback({ type: 'success', text: data.message || 'Article re-published successfully.' });
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

  const handleSetCurrentIssue = async (issueId: string, issueTitle: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/set-current`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to designate current issue');
      setFeedback({ type: 'success', text: data.message || `Issue "${issueTitle}" set as Current Issue.` });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  const handleDeleteIssue = async (issueId: string, issueTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete issue "${issueTitle}"? Any articles currently assigned to this issue will be safely returned to the Production queue.`)) {
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/issues/${issueId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete issue');
      setFeedback({ type: 'success', text: data.message || `Issue "${issueTitle}" deleted successfully.` });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  const handleTogglePublishIssue = async (issueId: string, isPublished: boolean, issueTitle: string) => {
    const endpoint = isPublished ? `/api/issues/${issueId}/unpublish` : `/api/issues/${issueId}/republish`;
    const actionName = isPublished ? 'unpublish' : 'publish';
    if (!window.confirm(`Are you sure you want to ${actionName} issue "${issueTitle}"?`)) {
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${actionName} issue`);
      setFeedback({ type: 'success', text: data.message || `Issue "${issueTitle}" updated successfully.` });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  const openEditIssueModal = (iss: any) => {
    setEditingIssue(iss);
    setEditIssueTitle(iss.title || '');
    setEditIssueNumber(iss.issueNumber || 1);
    setEditIssueYear(iss.year || new Date().getFullYear());
    setEditIssueStatus(iss.status || 'DRAFT');
    setEditIssueIsCurrent(Boolean(iss.isCurrent));
    setEditIssueScheduledDate(iss.scheduledPublishDate ? iss.scheduledPublishDate.split('T')[0] : '');
    setEditIssueExistingCoverUrl(iss.coverImageUrl || '');
    setEditIssueCoverFile(null);
    setEditIssueDescription(iss.description || '');
    setEditIssueEditorialIntro(iss.editorialIntroduction || '');
    setEditIssueModalOpen(true);
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      let resolvedCoverUrl: string | undefined = undefined;
      if (newIssueCoverFile) {
        const formData = new FormData();
        formData.append('file', newIssueCoverFile);
        formData.append('bucket', 'published-articles');
        const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload cover');
        resolvedCoverUrl = uploadData.publicUrl || uploadData.storageUrl || `/storage/${uploadData.storageKey}`;
      }

      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journalId: newIssueJournalId,
          volumeNumber: newIssueVolumeNumber,
          issueNumber: newIssueNumber,
          year: newIssueYear,
          title: newIssueTitle,
          description: newIssueDescription,
          status: newIssueStatus,
          isCurrent: newIssueIsCurrent,
          scheduledPublishDate: newIssueScheduledDate || undefined,
          editorialIntroduction: newIssueEditorialIntro || undefined,
          coverImageUrl: resolvedCoverUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create issue');
      setFeedback({ type: 'success', text: `Issue "${newIssueTitle}" created successfully.` });
      setCreateIssueModalOpen(false);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  const handleEditIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue) return;
    setLoading(true);
    setFeedback(null);
    try {
      let resolvedCoverUrl = editIssueExistingCoverUrl;
      if (editIssueCoverFile) {
        const formData = new FormData();
        formData.append('file', editIssueCoverFile);
        formData.append('bucket', 'published-articles');
        const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload cover');
        resolvedCoverUrl = uploadData.publicUrl || uploadData.storageUrl || `/storage/${uploadData.storageKey}`;
      }

      const res = await fetch(`/api/issues/${editingIssue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editIssueTitle,
          issueNumber: editIssueNumber,
          year: editIssueYear,
          status: editIssueStatus,
          isCurrent: editIssueIsCurrent,
          scheduledPublishDate: editIssueScheduledDate || null,
          coverImageUrl: resolvedCoverUrl || null,
          description: editIssueDescription,
          editorialIntroduction: editIssueEditorialIntro,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update issue');
      setFeedback({ type: 'success', text: `Issue "${editIssueTitle}" updated successfully.` });
      setEditIssueModalOpen(false);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold overflow-x-auto scrollbar-none">
        {[
          { key: 'overview', label: 'Platform Overview' },
          { key: 'users', label: `Users & Roles (${users.length})` },
          { key: 'journals', label: `Journals (${journals.length})` },
          { key: 'issues', label: `Issues & Volumes (${issues.length})` },
          { key: 'articles', label: `Published Articles (${publishedArticles.length})` },
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

              <button
                onClick={() => setImportModalOpen(true)}
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Import Article to Issue (Bypass Workflow)</span>
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

                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
                  <Link href={`/journals/${j.slug}`} className="text-blue-700 font-semibold hover:underline">
                    Public View
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setBoardModalJournal(j)}
                      className="inline-flex items-center space-x-1 py-1 px-2.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-[11px] border border-blue-200 transition-colors"
                      title="Manage Editorial Board appointments"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Editorial Board</span>
                    </button>
                    <button
                      onClick={() => setGuidelinesModalJournal(j)}
                      className="inline-flex items-center space-x-1 py-1 px-2.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-[11px] border border-indigo-200 transition-colors"
                      title="Manage Author Guidelines"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Author Guidelines</span>
                    </button>
                    <button
                      onClick={() => openEditJournalModal(j)}
                      className="inline-flex items-center space-x-1 py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit & Cover</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ISSUES & VOLUMES MANAGEMENT TAB */}
      {activeTab === 'issues' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <h3 className="font-bold text-slate-900 text-base">
                  Journal Volumes & Issues Administration
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure publication volumes, add and edit issues, upload cover artwork, and designate each journal&apos;s active Current Issue.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Direct Import Article</span>
              </button>
              {journals.length > 1 && (
                <select
                  value={filterIssueJournalId}
                  onChange={(e) => setFilterIssueJournalId(e.target.value)}
                  className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none font-medium text-slate-700 shadow-xs"
                >
                  <option value="ALL">All Journals ({journals.length})</option>
                  {journals.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.abbreviation})
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => {
                  if (journals[0]) setNewIssueJournalId(journals[0].id);
                  setCreateIssueModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Issue</span>
              </button>
            </div>
          </div>

          {(() => {
            const displayedIssues = issues.filter(
              (iss) => filterIssueJournalId === 'ALL' || iss.journalId === filterIssueJournalId
            );

            if (displayedIssues.length === 0) {
              return (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-500 space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No issues found</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No publication issues have been created yet for this journal.
                    Create an issue to organize published articles and assign catalog volumes.
                  </p>
                  <button
                    onClick={() => {
                      if (journals[0]) setNewIssueJournalId(journals[0].id);
                      setCreateIssueModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-navy-900 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Issue</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedIssues.map((iss) => {
                  const articleCount = iss._count?.publishedArticles || iss.publishedArticles?.length || 0;
                  return (
                    <div
                      key={iss.id}
                      className={`bg-white border rounded-xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden ${
                        iss.isCurrent ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-3">
                        {iss.coverImageUrl ? (
                          <div className="relative h-36 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                            <img
                              src={iss.coverImageUrl}
                              alt={iss.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : iss.journal?.coverImageUrl ? (
                          <div className="relative h-36 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                            <img
                              src={iss.journal.coverImageUrl}
                              alt={iss.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-28 w-full bg-navy-950 rounded-lg flex flex-col items-center justify-center text-white p-3 text-center">
                            <BookOpen className="w-7 h-7 text-blue-400 mb-1" />
                            <span className="text-xs font-bold">Vol. {iss.volume?.volumeNumber || 1}, No. {iss.issueNumber}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {iss.journal?.abbreviation || 'JOURNAL'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {iss.isCurrent && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-current text-amber-600" />
                                <span>CURRENT ISSUE</span>
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                iss.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : iss.status === 'SCHEDULED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {iss.status}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                            {iss.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Vol. {iss.volume?.volumeNumber || 1}, Issue {iss.issueNumber} ({iss.year})
                          </p>
                        </div>

                        {iss.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {iss.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Published Articles:</span>
                          <span className="font-bold text-slate-800">{articleCount}</span>
                        </div>

                        {iss.publicationDate && (
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Released:</span>
                            <span className="text-slate-700">
                              {new Date(iss.publicationDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 flex flex-col gap-2">
                          {/* Current Issue Action */}
                          {!iss.isCurrent ? (
                            <button
                              onClick={() => handleSetCurrentIssue(iss.id, iss.title)}
                              disabled={loading}
                              className="w-full text-center py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-[11px] transition-colors inline-flex items-center justify-center space-x-1"
                              title="Designate this issue as the Current Issue for this journal"
                            >
                              <Star className="w-3 h-3 text-amber-600" />
                              <span>Set as Current Issue</span>
                            </button>
                          ) : (
                            <div className="w-full text-center py-1 rounded bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200">
                              ⭐ Designated Current Issue
                            </div>
                          )}

                          {/* Action Toolbar */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {iss.journal?.slug && (
                              <Link
                                href={`/issues/${iss.id}`}
                                className="flex-1 text-center py-1.5 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
                              >
                                View Catalog
                              </Link>
                            )}

                            {iss.status === 'PUBLISHED' ? (
                              <button
                                onClick={() => handleTogglePublishIssue(iss.id, true, iss.title)}
                                disabled={loading}
                                className="p-1.5 rounded hover:bg-amber-50 text-slate-500 hover:text-amber-700 transition-colors"
                                title="Unpublish Issue (revert to Draft)"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTogglePublishIssue(iss.id, false, iss.title)}
                                disabled={loading}
                                className="p-1.5 rounded hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors"
                                title="Publish Issue"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => openEditIssueModal(iss)}
                              disabled={loading}
                              className="p-1.5 rounded hover:bg-blue-50 text-slate-500 hover:text-blue-700 transition-colors"
                              title="Edit Issue & Cover Image"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteIssue(iss.id, iss.title)}
                              disabled={loading}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Issue"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* PUBLISHED ARTICLES TAB */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Article Governance — Master Admin Controls
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unpublish live articles or re-publish articles that have been returned to Production across all journals.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportModalOpen(true)}
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 shadow-xs shrink-0"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Import Article (Bypass Workflow)</span>
              </button>
              <input
                type="text"
                placeholder="Search by title, author, journal…"
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none w-full sm:w-64"
              />
            </div>
          </div>

          {/* Sub-tab switcher */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs">
            <button
              onClick={() => setArticlesSubTab('published')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                articlesSubTab === 'published'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Live Published ({publishedArticles.length})
            </button>
            <button
              onClick={() => setArticlesSubTab('production')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                articlesSubTab === 'production'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unpublished / Production ({productionSubmissions.length})
            </button>
          </div>

          {articlesSubTab === 'published' ? (
            <div className="space-y-3">
              {publishedArticles
                .filter((a) => {
                  const q = articleSearch.toLowerCase();
                  if (!q) return true;
                  const authors = (a.submission?.coAuthors || []).map((au: any) => `${au.firstName} ${au.lastName}`).join(' ');
                  return (
                    a.title?.toLowerCase().includes(q) ||
                    a.journal?.title?.toLowerCase().includes(q) ||
                    a.journal?.abbreviation?.toLowerCase().includes(q) ||
                    authors.toLowerCase().includes(q) ||
                    a.doi?.toLowerCase().includes(q)
                  );
                })
                .map((article: any) => {
                  const authors = (article.submission?.coAuthors || [])
                    .map((a: any) => `${a.firstName} ${a.lastName}`)
                    .join(', ');
                  return (
                    <div key={article.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            {article.journal?.abbreviation}
                          </span>
                          {article.issue?.volume && (
                            <span className="text-slate-500">
                              Vol. {article.issue.volume.volumeNumber}, No. {article.issue.issueNumber} ({article.issue.year})
                            </span>
                          )}
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{new Date(article.publishedAt).toLocaleDateString()}</span>
                          <span className="inline-flex items-center space-x-1 text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            <Eye className="w-3 h-3" />
                            <span>{article.viewsCount || 0}</span>
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 scholarly-heading">
                          <a href={`/articles/${article.id}`} target="_blank" rel="noreferrer" className="hover:text-blue-700">
                            {article.title}
                          </a>
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">{authors}</p>
                        {article.doi && (
                          <div className="text-[11px] font-mono text-slate-500">
                            DOI: {article.doi}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`/articles/${article.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                        <button
                          onClick={() => handleUnpublishArticle(article.id)}
                          disabled={loading}
                          title="Unpublish — removes from public view and returns to Production"
                          className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Unpublish</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              {publishedArticles.filter((a) => {
                const q = articleSearch.toLowerCase();
                if (!q) return true;
                const authors = (a.submission?.coAuthors || []).map((au: any) => `${au.firstName} ${au.lastName}`).join(' ');
                return a.title?.toLowerCase().includes(q) || a.journal?.title?.toLowerCase().includes(q) || a.journal?.abbreviation?.toLowerCase().includes(q) || authors.toLowerCase().includes(q) || a.doi?.toLowerCase().includes(q);
              }).length === 0 && (
                <div className="p-10 text-center text-sm text-slate-500">
                  No published articles found{articleSearch ? ` matching "${articleSearch}"` : ''}.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {productionSubmissions
                .filter((sub) => {
                  const q = articleSearch.toLowerCase();
                  if (!q) return true;
                  const authors = (sub.coAuthors || []).map((au: any) => `${au.firstName} ${au.lastName}`).join(' ');
                  return (
                    sub.title?.toLowerCase().includes(q) ||
                    sub.submissionNumber?.toLowerCase().includes(q) ||
                    sub.journal?.title?.toLowerCase().includes(q) ||
                    sub.journal?.abbreviation?.toLowerCase().includes(q) ||
                    authors.toLowerCase().includes(q)
                  );
                })
                .map((sub: any) => {
                  const authors = (sub.coAuthors || [])
                    .map((a: any) => `${a.firstName} ${a.lastName}`)
                    .join(', ');
                  return (
                    <div key={sub.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            {sub.submissionNumber}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {sub.journal?.abbreviation}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px]">
                            {sub.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 scholarly-heading">
                          {sub.title}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">{authors}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleRepublishArticle(sub.id)}
                          disabled={loading}
                          title="Re-publish this article so it becomes publicly accessible again"
                          className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Re-publish</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              {productionSubmissions.filter((sub) => {
                const q = articleSearch.toLowerCase();
                if (!q) return true;
                const authors = (sub.coAuthors || []).map((au: any) => `${au.firstName} ${au.lastName}`).join(' ');
                return sub.title?.toLowerCase().includes(q) || sub.submissionNumber?.toLowerCase().includes(q) || sub.journal?.title?.toLowerCase().includes(q) || sub.journal?.abbreviation?.toLowerCase().includes(q) || authors.toLowerCase().includes(q);
              }).length === 0 && (
                <div className="p-10 text-center text-sm text-slate-500">
                  No unpublished or production manuscripts found{articleSearch ? ` matching "${articleSearch}"` : ''}.
                </div>
              )}
            </div>
          )}
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

      {/* CREATE ISSUE MODAL */}
      {createIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-blue-700" />
                <span>Create New Journal Issue</span>
              </h3>
              <button onClick={() => setCreateIssueModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Target Journal *
                </label>
                <select
                  value={newIssueJournalId}
                  onChange={(e) => setNewIssueJournalId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none font-semibold text-slate-800"
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
                  Issue Title / Theme Designation *
                </label>
                <input
                  type="text"
                  required
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  placeholder="e.g. Regular Issue, Special Issue on Foundation Models..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Volume Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newIssueVolumeNumber}
                    onChange={(e) => setNewIssueVolumeNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Issue Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newIssueNumber}
                    onChange={(e) => setNewIssueNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Publication Year *
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    required
                    value={newIssueYear}
                    onChange={(e) => setNewIssueYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Publication Status *
                  </label>
                  <select
                    value={newIssueStatus}
                    onChange={(e) => setNewIssueStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none font-semibold text-slate-800"
                  >
                    <option value="DRAFT">Draft (In Progress)</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="PUBLISHED">Published (Live in Catalog)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Scheduled Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newIssueScheduledDate}
                    onChange={(e) => setNewIssueScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              {/* Current Issue Checkbox */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="newIssueIsCurrent"
                  checked={newIssueIsCurrent}
                  onChange={(e) => setNewIssueIsCurrent(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="newIssueIsCurrent" className="font-semibold text-slate-800 text-xs cursor-pointer">
                  Designate as Current Issue for this journal
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Issue Front Cover Artwork (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewIssueCoverFile(e.target.files?.[0] || null)}
                  className="w-full py-1 text-slate-700 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Upload front cover image (.png, .jpg, .webp).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Description / Issue Scope (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newIssueDescription}
                  onChange={(e) => setNewIssueDescription(e.target.value)}
                  placeholder="Summary of articles and special themes covered in this issue..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Editorial Introduction / Foreword (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newIssueEditorialIntro}
                  onChange={(e) => setNewIssueEditorialIntro(e.target.value)}
                  placeholder="Foreword from the Editor-in-Chief or Guest Editors..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateIssueModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newIssueTitle}
                  className="bg-navy-900 hover:bg-navy-950 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating Issue...' : 'Create Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ISSUE MODAL */}
      {editIssueModalOpen && editingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Edit3 className="w-4 h-4 text-blue-700" />
                  <span>Edit Issue: {editingIssue.title}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingIssue.journal?.abbreviation} &bull; Vol. {editingIssue.volume?.volumeNumber || 1}, Issue {editingIssue.issueNumber} ({editingIssue.year})
                </p>
              </div>
              <button onClick={() => setEditIssueModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleEditIssueSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Issue Title / Theme Designation *
                </label>
                <input
                  type="text"
                  required
                  value={editIssueTitle}
                  onChange={(e) => setEditIssueTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Issue Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editIssueNumber}
                    onChange={(e) => setEditIssueNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Publication Year *
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    required
                    value={editIssueYear}
                    onChange={(e) => setEditIssueYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Publication Status *
                  </label>
                  <select
                    value={editIssueStatus}
                    onChange={(e) => setEditIssueStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none font-semibold text-slate-800"
                  >
                    <option value="DRAFT">Draft (In Progress)</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="PUBLISHED">Published (Live in Catalog)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Scheduled Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={editIssueScheduledDate}
                    onChange={(e) => setEditIssueScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              {/* Current Issue Checkbox */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="editIssueIsCurrent"
                  checked={editIssueIsCurrent}
                  onChange={(e) => setEditIssueIsCurrent(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="editIssueIsCurrent" className="font-semibold text-slate-800 text-xs cursor-pointer">
                  Designate as Current Issue for this journal
                </label>
              </div>

              {/* Cover Image Upload & Current Preview */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block font-bold text-slate-700 uppercase text-[11px]">
                  Issue Cover Image
                </label>
                {editIssueExistingCoverUrl && (
                  <div className="relative h-28 w-20 rounded border border-slate-300 overflow-hidden shadow-xs bg-white">
                    <img
                      src={editIssueExistingCoverUrl}
                      alt="Current Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditIssueCoverFile(e.target.files?.[0] || null)}
                  className="w-full py-1 text-slate-700 text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  Select a new image (.png, .jpg, .webp) to update or replace the issue cover artwork.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Description / Issue Scope
                </label>
                <textarea
                  rows={2}
                  value={editIssueDescription}
                  onChange={(e) => setEditIssueDescription(e.target.value)}
                  placeholder="Overview of articles and themes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Editorial Introduction / Foreword
                </label>
                <textarea
                  rows={2}
                  value={editIssueEditorialIntro}
                  onChange={(e) => setEditIssueEditorialIntro(e.target.value)}
                  placeholder="Foreword from the Editor-in-Chief..."
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditIssueModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !editIssueTitle}
                  className="bg-navy-900 hover:bg-navy-950 text-white font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Issue Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIRECT ARTICLE IMPORT MODAL */}
      <ImportArticleModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        journals={journals}
        onSuccess={(msg) => setFeedback({ type: 'success', text: msg })}
      />

      {/* EDITORIAL BOARD APPOINTMENT MODAL */}
      <AdminEditorialBoardModal
        isOpen={!!boardModalJournal}
        onClose={() => setBoardModalJournal(null)}
        journal={boardModalJournal}
        platformUsers={users}
        onBoardUpdated={() => {
          // Trigger refresh
        }}
      />

      {/* AUTHOR GUIDELINES EDITOR MODAL */}
      <AdminAuthorGuidelinesModal
        isOpen={!!guidelinesModalJournal}
        onClose={() => setGuidelinesModalJournal(null)}
        journal={guidelinesModalJournal}
      />
    </div>
  );
}
