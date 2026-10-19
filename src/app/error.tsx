'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details for diagnostics
    console.error('NextGen Innovation & Research Journals caught application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-16">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-red-100/70 text-red-800 text-xs px-3 py-1 rounded-full font-medium">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Platform Service Notice</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 scholarly-heading">
            Application Exception Encountered
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The platform encountered an unexpected server-side event while processing this request. Our technical operations log has recorded this incident.
          </p>
        </div>

        {error?.digest && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Diagnostic Digest Reference
            </div>
            <code className="text-xs font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 block truncate">
              {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors border border-slate-200"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
