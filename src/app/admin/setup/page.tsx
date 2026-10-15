'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ShieldAlert, CheckCircle, Lock, Key, AlertTriangle } from 'lucide-react';

export default function AdminSetupPage() {
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [designatedEmailMasked, setDesignatedEmailMasked] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/bootstrap')
      .then((res) => res.json())
      .then((data) => {
        setIsInitialized(data.isInitialized);
        setDesignatedEmailMasked(data.designatedEmailMasked);
        setStatusLoading(false);
      })
      .catch(() => setStatusLoading(false));
  }, []);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, affiliation }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bootstrap failed');
      }

      setMessage({ type: 'success', text: data.message });
      setIsInitialized(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <p className="text-sm text-slate-500">Checking master administrator security status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className={`p-6 text-white text-center ${isInitialized ? 'bg-slate-900' : 'bg-navy-950'}`}>
          <div className="inline-flex p-3 bg-amber-500 rounded-lg mb-3 shadow">
            <Shield className="w-8 h-8 text-navy-950" />
          </div>
          <h2 className="text-xl font-bold scholarly-heading">Master Administrator Provisioning</h2>
          <p className="text-xs text-slate-300 mt-1">Platform Governance & Security Initialization</p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {isInitialized ? (
            <div className="space-y-4 text-center py-6">
              <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Platform Initialized</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                The Master Administrator role has already been claimed and initialized. For security, public first-run bootstrap is permanently closed.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => router.push('/login')}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-md text-sm transition-colors"
                >
                  Proceed to Login
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                <div className="flex items-center space-x-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>First-Run Security Requirement</span>
                </div>
                <p>
                  This one-time bootstrap allows the legitimate publisher owner to claim master governance of NextGen Press. The email entered below must strictly match the server environment variable <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">MASTER_ADMIN_EMAIL</code> ({designatedEmailMasked || 'configured on server'}).
                </p>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-md text-xs ${
                    message.type === 'error'
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleBootstrap} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Designated Master Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nextgen-press.org"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Full Legal Name & Title
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Evelyn Vance (Executive Director)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Publisher / Academic Affiliation
                  </label>
                  <input
                    type="text"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="NextGen Press Governance Board"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Administrator Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-navy-900 hover:bg-navy-950 text-white font-semibold py-2.5 px-4 rounded-md text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>{submitting ? 'Initializing Master Authority...' : 'Initialize Master Administrator'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
