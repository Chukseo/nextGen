'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  BookOpen,
  Search,
  UploadCloud,
  User,
  Shield,
  FileText,
  CheckCircle,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const roles = (session?.user as any)?.roles || [];
  const isMasterAdmin = roles.some((r: any) => r.role === 'MASTER_ADMIN');
  const isEditor = roles.some((r: any) => r.role === 'EDITOR' || r.role === 'JOURNAL_MANAGER');
  const isReviewer = roles.some((r: any) => r.role === 'REVIEWER');
  const isAuthor = roles.some((r: any) => r.role === 'AUTHOR');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Top Organization Header */}
      <div className="bg-navy-950 text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-navy-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-white tracking-wide uppercase">Open Access Academic Publisher</span>
            <span className="text-slate-500">•</span>
            <span className="hidden sm:inline">Crossref Member & COPE Guidelines Compliant</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin/setup" className="hover:text-blue-300 flex items-center space-x-1">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Admin Setup</span>
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/editorial-policies" className="hover:text-white">Publication Ethics</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <img
              src="/logo.png"
              alt="NextGen Research & Innovation Press"
              className="h-11 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <div className="text-lg font-bold text-navy-950 scholarly-heading tracking-tight leading-tight">
                NextGen Research & Innovation Press
              </div>
              <div className="text-xs text-slate-500 font-medium tracking-wide">
                Scholarly Peer-Reviewed Journal Systems
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-700">
            <Link href="/" className="hover:text-blue-700 transition-colors">Home</Link>
            <Link href="/journals" className="hover:text-blue-700 transition-colors">Journals</Link>
            <Link href="/issues" className="hover:text-blue-700 transition-colors">Current Issues</Link>
            <Link href="/articles" className="hover:text-blue-700 transition-colors flex items-center space-x-1">
              <Search className="w-3.5 h-3.5" />
              <span>Search Research</span>
            </Link>
            <Link href="/about" className="hover:text-blue-700 transition-colors">About</Link>
          </nav>

          {/* Action CTAs & Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/submit"
              className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit Manuscript</span>
            </Link>

            {status === 'authenticated' ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 border border-slate-200 hover:border-slate-300 rounded-full py-1.5 px-3 text-sm text-slate-800 bg-slate-50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {session.user?.name ? session.user.name.charAt(0) : 'U'}
                  </div>
                  <span className="max-w-[120px] truncate font-medium">{session.user?.name || session.user?.email}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{session.user?.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {roles.map((r: any, idx: number) => (
                          <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                            {r.role}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="py-1">
                      {isMasterAdmin && (
                        <Link
                          href="/dashboard/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-amber-800 hover:bg-amber-50 font-medium"
                        >
                          <Shield className="w-4 h-4 text-amber-600" />
                          <span>Master Admin Console</span>
                        </Link>
                      )}

                      {(isEditor || isMasterAdmin) && (
                        <Link
                          href="/dashboard/editor"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Editorial Dashboard</span>
                        </Link>
                      )}

                      {(isReviewer || isMasterAdmin) && (
                        <Link
                          href="/dashboard/reviewer"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Reviewer Center</span>
                        </Link>
                      )}

                      <Link
                        href="/dashboard/author"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-indigo-600" />
                        <span>Author Portal</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-blue-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded border border-slate-200 transition-colors"
                >
                  Scholar Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4 space-y-3">
            <Link href="/" className="block text-slate-800 font-medium py-1">Home</Link>
            <Link href="/journals" className="block text-slate-800 font-medium py-1">Journals</Link>
            <Link href="/issues" className="block text-slate-800 font-medium py-1">Current Issues</Link>
            <Link href="/articles" className="block text-slate-800 font-medium py-1">Search Research</Link>
            <Link href="/submit" className="block text-blue-700 font-semibold py-1">Submit Manuscript</Link>
            {status === 'authenticated' ? (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link href="/dashboard/author" className="block text-slate-700 font-medium">Author Portal</Link>
                <Link href="/dashboard/editor" className="block text-slate-700 font-medium">Editor Dashboard</Link>
                <Link href="/dashboard/admin" className="block text-amber-700 font-medium">Admin Console</Link>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="text-rose-600 font-medium">Sign Out</button>
              </div>
            ) : (
              <Link href="/login" className="block text-blue-700 font-semibold">Sign In / Register</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
