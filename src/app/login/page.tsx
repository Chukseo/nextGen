'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Shield, User, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(errorParam ? 'Authentication failed. Please verify your credentials.' : '');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: demoEmail,
        password: 'NextGen2026!',
      });
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-navy-950 p-6 text-white text-center border-b border-navy-900">
          <div className="inline-flex p-3 bg-blue-700 rounded-lg mb-3 shadow">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold scholarly-heading">NextGen Press Portal</h2>
          <p className="text-xs text-slate-300 mt-1">Scholarly Authentication & Author Submissions</p>
        </div>

        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Primary Google Sign In */}
          <div>
            <button
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 border border-slate-300 rounded-md shadow-sm bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Authors sign in with Google to create and track manuscript submissions.
            </p>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-xs uppercase font-medium">Or Sign In with Scholarly ID</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scholar@institution.edu"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-900 hover:bg-navy-950 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Role Tester Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-blue-700" />
              <span>Role Switching (Dev & Testing)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Test end-to-end workflows by clicking any pre-seeded persona:
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@nextgen-press.org')}
                className="text-left text-[11px] p-2 bg-white hover:bg-amber-50 border border-amber-200 rounded text-amber-900 transition-colors"
              >
                <span className="font-bold block text-amber-800">Master Admin</span>
                <span className="text-[10px] text-slate-500">Dr. Evelyn Vance</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('editor.chen@nextgen-press.org')}
                className="text-left text-[11px] p-2 bg-white hover:bg-blue-50 border border-blue-200 rounded text-blue-900 transition-colors"
              >
                <span className="font-bold block text-blue-800">Editor-in-Chief</span>
                <span className="text-[10px] text-slate-500">Prof. Marcus Chen</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('reviewer.turing@univ.edu')}
                className="text-left text-[11px] p-2 bg-white hover:bg-emerald-50 border border-emerald-200 rounded text-emerald-900 transition-colors"
              >
                <span className="font-bold block text-emerald-800">Peer Reviewer</span>
                <span className="text-[10px] text-slate-500">Dr. Alan Turing</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('author.lewis@research.org')}
                className="text-left text-[11px] p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded text-indigo-900 transition-colors"
              >
                <span className="font-bold block text-indigo-800">Author</span>
                <span className="text-[10px] text-slate-500">Dr. David Lewis</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
