export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 sm:px-6 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
            404 — Not Found
          </span>
          <h1 className="text-2xl font-bold text-slate-900 scholarly-heading">
            Scholarly Resource Not Located
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The manuscript, journal volume, or editorial portal page you requested could not be found or may have been relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/articles"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Library</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
