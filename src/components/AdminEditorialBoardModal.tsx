'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Building,
  GraduationCap,
  Mail,
  Loader2
} from 'lucide-react';

interface EditorialMember {
  id: string;
  roleTitle: string;
  affiliation: string;
  displayOrder: number;
  user: {
    id: string;
    name: string;
    email: string;
    affiliation?: string | null;
    orcid?: string | null;
  };
}

interface AdminEditorialBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: {
    id: string;
    slug: string;
    title: string;
    abbreviation: string;
  } | null;
  platformUsers?: any[];
  onBoardUpdated?: () => void;
}

export default function AdminEditorialBoardModal({
  isOpen,
  onClose,
  journal,
  platformUsers = [],
  onBoardUpdated,
}: AdminEditorialBoardModalProps) {
  const [loading, setLoading] = useState(false);
  const [boardMembers, setBoardMembers] = useState<EditorialMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [internalUsers, setInternalUsers] = useState<any[]>(platformUsers || []);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('Associate Editor');
  const [affiliation, setAffiliation] = useState('');
  const [orcid, setOrcid] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Editing state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editAffiliation, setEditAffiliation] = useState('');
  const [editOrder, setEditOrder] = useState(0);

  const roleSuggestions = [
    'Editor-in-Chief',
    'Senior Associate Editor',
    'Associate Editor',
    'Section Editor',
    'Advisory Board Member',
    'Managing Editor',
    'Statistical Review Editor',
  ];

  const fetchBoard = async () => {
    if (!journal) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/journals/${journal.id}/editorial-board`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch board');
      setBoardMembers(data.editorialBoard || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (platformUsers && platformUsers.length > 0) {
      setInternalUsers(platformUsers);
    } else if (isOpen) {
      fetch('/api/admin/users')
        .then(res => res.json())
        .then(data => {
          if (data.users) setInternalUsers(data.users);
        })
        .catch(() => {});
    }
  }, [isOpen, platformUsers]);

  useEffect(() => {
    if (isOpen && journal) {
      fetchBoard();
      setShowAddForm(false);
      setEditingMemberId(null);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, journal?.id]);

  if (!isOpen || !journal) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (!roleTitle.trim()) {
        throw new Error('Please specify an editorial role title (e.g. Editor-in-Chief, Associate Editor).');
      }

      if (!selectedUserId && (!customName.trim() || !customEmail.trim())) {
        throw new Error('Please select an existing platform user or provide both full name and email.');
      }

      const payload = {
        userId: selectedUserId || undefined,
        name: customName.trim(),
        email: customEmail.trim(),
        roleTitle: roleTitle.trim(),
        affiliation: affiliation.trim() || 'Academic Research Institution',
        orcid: orcid.trim() || undefined,
      };

      const res = await fetch(`/api/admin/journals/${journal.id}/editorial-board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member to editorial board');

      setSuccessMsg(data.message || 'Board member added successfully');
      setShowAddForm(false);
      setSelectedUserId('');
      setCustomName('');
      setCustomEmail('');
      setAffiliation('');
      setOrcid('');
      await fetchBoard();
      if (onBoardUpdated) onBoardUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (memberId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/journals/${journal.id}/editorial-board`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          roleTitle: editRoleTitle.trim(),
          affiliation: editAffiliation.trim(),
          displayOrder: editOrder,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member');

      setEditingMemberId(null);
      setSuccessMsg('Member updated successfully');
      await fetchBoard();
      if (onBoardUpdated) onBoardUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the Editorial Board?`)) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/journals/${journal.id}/editorial-board?memberId=${memberId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete member');

      setSuccessMsg('Member removed from Editorial Board');
      await fetchBoard();
      if (onBoardUpdated) onBoardUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= boardMembers.length) return;

    const current = boardMembers[index];
    const target = boardMembers[targetIndex];

    try {
      await Promise.all([
        fetch(`/api/admin/journals/${journal.id}/editorial-board`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: current.id, displayOrder: target.displayOrder }),
        }),
        fetch(`/api/admin/journals/${journal.id}/editorial-board`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: target.id, displayOrder: current.displayOrder }),
        }),
      ]);
      await fetchBoard();
      if (onBoardUpdated) onBoardUpdated();
    } catch (err: any) {
      setError('Failed to update display order: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  {journal.abbreviation}
                </span>
                <h3 className="text-lg font-bold text-slate-900 scholarly-heading">
                  Editorial Board Management
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage appointed Editors-in-Chief, Associate Editors, and Advisory Board for {journal.title}
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

        {/* Status Alerts */}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Header Action Bar */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-600">
              Total Board Members: <strong>{boardMembers.length}</strong>
            </div>
            {!showAddForm && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Appoint New Board Member</span>
              </button>
            )}
          </div>

          {/* Add Board Member Form */}
          {showAddForm && (
            <form onSubmit={handleAddMember} className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  Appoint New Editorial Board Member
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {internalUsers.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Choose from Registered Platform Users (Optional)
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedUserId(val);
                        if (val) {
                          const found = internalUsers.find(u => u.id === val);
                          if (found) {
                            setCustomName(found.name || '');
                            setCustomEmail(found.email || '');
                            if (found.affiliation) setAffiliation(found.affiliation);
                            if (found.orcid) setOrcid(found.orcid);
                          }
                        } else {
                          setSelectedUserId('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- Or enter new scholar details below --</option>
                      {internalUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name || 'Scholar'} ({u.email}) {u.affiliation ? `- ${u.affiliation}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scholar Full Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Prof. Jane Doe, Ph.D."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="jane.doe@university.edu"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Editorial Role Title *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g. Editor-in-Chief"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) setRoleTitle(e.target.value);
                      }}
                      value=""
                      className="px-2 py-1 text-[11px] border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                    >
                      <option value="">Presets</option>
                      {roleSuggestions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Affiliation & Institution *</label>
                  <input
                    type="text"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="e.g. Stanford University / MIT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">ORCID Identifier (Optional)</label>
                  <input
                    type="text"
                    value={orcid}
                    onChange={(e) => setOrcid(e.target.value)}
                    placeholder="0000-0002-1825-0097"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-xs disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Appointing...' : 'Save Member to Board'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Board Members Table / List */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading current editorial board...</span>
            </div>
          ) : boardMembers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No editorial board members appointed yet for {journal.title}.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {boardMembers.map((member, idx) => {
                const isEditing = editingMemberId === member.id;

                if (isEditing) {
                  return (
                    <div key={member.id} className="p-4 bg-slate-50 space-y-3 text-xs">
                      <div className="font-bold text-slate-800">
                        Editing appointment for {member.user.name}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Role Title</label>
                          <input
                            type="text"
                            value={editRoleTitle}
                            onChange={(e) => setEditRoleTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Affiliation</label>
                          <input
                            type="text"
                            value={editAffiliation}
                            onChange={(e) => setEditAffiliation(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Display Order</label>
                          <input
                            type="number"
                            value={editOrder}
                            onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 0)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingMemberId(null)}
                          className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(member.id)}
                          disabled={submitting}
                          className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded disabled:opacity-50"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={member.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {member.user.name || 'Scholar Member'}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {member.roleTitle}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          #{member.displayOrder}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{member.affiliation || member.user.affiliation}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{member.user.email}</span>
                        </span>
                        {member.user.orcid && (
                          <span className="text-emerald-700 font-mono text-[11px]">
                            ORCID: {member.user.orcid}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={idx === boardMembers.length - 1}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingMemberId(member.id);
                          setEditRoleTitle(member.roleTitle);
                          setEditAffiliation(member.affiliation);
                          setEditOrder(member.displayOrder);
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-700 rounded hover:bg-slate-100"
                        title="Edit appointment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id, member.user.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>
            Changes to the editorial board are instantly published to the journal's public directory.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
