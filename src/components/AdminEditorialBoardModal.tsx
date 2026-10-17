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
  Mail
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
      const payload: any = {
        roleTitle,
        affiliation,
      };

      if (selectedUserId) {
        payload.userId = selectedUserId;
      } else {
        payload.name = customName;
        payload.email = customEmail;
        if (orcid) payload.orcid = orcid;
      }

      const res = await fetch(`/api/admin/journals/${journal.id}/editorial-board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setSuccessMsg(data.message || 'Board member added successfully');
      setShowAddForm(false);
      setSelectedUserId('');
      setCustomName('');
      setCustomEmail('');
      setAffiliation('');
      setOrcid('');
      fetchBoard();
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
          roleTitle: editRoleTitle,
          affiliation: editAffiliation,
          displayOrder: editOrder,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member');

      setEditingMemberId(null);
      setSuccessMsg('Member updated successfully');
      fetchBoard();
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
      fetchBoard();
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
      // Swap display order
      await fetch(`/api/admin/journals/${journal.id}/editorial-board`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: current.id,
          displayOrder: target.displayOrder,
        }),
      });

      await fetch(`/api/admin/journals/${journal.id}/editorial-board`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: target.id,
          displayOrder: current.displayOrder,
        }),
      });

      fetchBoard();
      if (onBoardUpdated) onBoardUpdated();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
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
                onClick={() => setShowAddForm(true)}
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
                {platformUsers.length > 0 && (
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
                          const found = platformUsers.find(u => u.id === val);
                          if (found) {
                            setCustomName(found.name);
                            setCustomEmail(found.email);
                            if (found.affiliation) setAffiliation(found.affiliation);
                            if (found.orcid) setOrcid(found.orcid);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- Or enter new scholar details below --</option>
                      {platformUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email}) - {u.affiliation || 'No Affiliation'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scholar Full Name *</label>
                  <input
                    type="text"
                    required
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
                    required
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
                      required
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
                    required
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
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Appointing...' : 'Save Member to Board'}
                </button>
              </div>
            </form>
          )}

          {/* Board Members Table / List */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading board members...
            </div>
          ) : boardMembers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No board members appointed yet</p>
              <p className="text-[11px] text-slate-400">Click &ldquo;Appoint New Board Member&rdquo; above to add members.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {boardMembers.map((member, idx) => {
                const isEditing = editingMemberId === member.id;
                return (
                  <div
                    key={member.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    {isEditing ? (
                      <div className="w-full space-y-3 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Role Title</label>
                            <input
                              type="text"
                              value={editRoleTitle}
                              onChange={(e) => setEditRoleTitle(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Affiliation</label>
                            <input
                              type="text"
                              value={editAffiliation}
                              onChange={(e) => setEditAffiliation(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Display Order</label>
                            <input
                              type="number"
                              value={editOrder}
                              onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingMemberId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSaveEdit(member.id)}
                            className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {/* Order Buttons */}
                          <div className="flex flex-col space-y-0.5 shrink-0 pt-0.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveOrder(idx, 'up')}
                              className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === boardMembers.length - 1}
                              onClick={() => handleMoveOrder(idx, 'down')}
                              className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {member.user.name}
                              </span>
                              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {member.roleTitle}
                              </span>
                              {member.user.orcid && (
                                <span className="text-[10px] text-emerald-700 font-mono">
                                  ORCID: {member.user.orcid}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{member.affiliation}</span>
                              <span className="text-slate-300">•</span>
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{member.user.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setEditRoleTitle(member.roleTitle);
                              setEditAffiliation(member.affiliation);
                              setEditOrder(member.displayOrder);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Title & Affiliation"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id, member.user.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Remove from Board"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 text-xs">
          <a
            href={`/journals/${journal.slug}/editorial-board`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-700 hover:underline font-semibold"
          >
            Preview Public Editorial Board &rarr;
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
