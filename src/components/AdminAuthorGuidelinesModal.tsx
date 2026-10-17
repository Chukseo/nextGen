'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface AdminAuthorGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: {
    id: string;
    slug: string;
    title: string;
    abbreviation: string;
  } | null;
}

export default function AdminAuthorGuidelinesModal({
  isOpen,
  onClose,
  journal,
}: AdminAuthorGuidelinesModalProps) {
  const [guidelines, setGuidelines] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchGuidelines = async () => {
    if (!journal) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/journals/${journal.id}/guidelines`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch guidelines');
      setGuidelines(data.guidelines || '');
      setIsCustom(data.isCustom || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && journal) {
      fetchGuidelines();
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, journal?.id]);

  if (!isOpen || !journal) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/journals/${journal.id}/guidelines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guidelines }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save guidelines');

      setIsCustom(true);
      setSuccessMsg('Author guidelines saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm(`Reset guidelines for ${journal.title} back to standard scholarly template? This will overwrite manual changes.`)) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/journals/${journal.id}/guidelines`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset guidelines');

      setGuidelines(data.guidelines || '');
      setIsCustom(false);
      setSuccessMsg('Guidelines reset to standard scholarly template.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = guidelines.trim() ? guidelines.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                  {journal.abbreviation}
                </span>
                {isCustom ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Custom Guidelines Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Auto-Generated Standard Template
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-900 scholarly-heading">
                  Author Guidelines Editor
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize formatting, submission instructions, and peer-review requirements for {journal.title}
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

        {/* Modal Body: Editor */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-3 text-slate-500">
              <span>Words: <strong>{wordCount}</strong></span>
              <span>•</span>
              <span>Markdown formatting supported (headings, bold, lists, quotes)</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={saving}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-600 hover:text-rose-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
                title="Reset to generated default template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Standard Template</span>
              </button>
              <a
                href={`/journals/${journal.slug}/guidelines`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 font-semibold transition-colors"
              >
                <span>Live Public Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <textarea
              rows={18}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              disabled={loading || saving}
              placeholder="Enter comprehensive instructions for authors..."
              className="w-full flex-1 p-4 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 resize-y"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="text-xs text-slate-500">
            Changes will immediately reflect on the public journal portal and submission wizard.
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Author Guidelines'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
