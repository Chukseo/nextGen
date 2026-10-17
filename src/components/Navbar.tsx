'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const roles = (session?.user as any)?.roles || [];
  const isMasterAdmin = roles.some((r: any) => r.role === 'MASTER_ADMIN');
  const isEditor = roles.some((r: any) => r.role === 'EDITOR' || r.role === 'JOURNAL_MANAGER');
  const isReviewer = roles.some((r: any) => r.role === 'REVIEWER');
  const isAuthor = roles.some((r: any) => r.role === 'AUTHOR');

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/journals', label: 'Journals' },
    { href: '/issues', label: 'Current Issues' },
    { href: '/articles', label: 'Search Research', icon: Search },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)]">
      {/* Top Organization Header */}
      <div className="bg-navy-950 text-slate-300 text-xs py-1.5 px-4 sm:px-6 lg:px-10 border-b border-navy-900">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-white tracking-wide uppercase">Open Access Academic Publisher</span>
            <span className="text-slate-500">•</span>
            <span className="hidden sm:inline">Crossref Member & COPE Guidelines Compliant</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/contact" className="hover:text-blue-300">
              Contact Office
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/editorial-policies" className="hover:text-white">Publication Ethics</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex justify-between items-center h-20 w-full gap-4 xl:gap-8 flex-nowrap">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
            <img
              src="/logo.png"
              alt="NextGen Research & Innovation Press"
              className="h-11 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <div className="text-base xl:text-lg font-bold text-navy-950 scholarly-heading tracking-tight leading-tight whitespace-nowrap">
                NextGen Research & Innovation Press
              </div>
              <div className="text-[11px] xl:text-xs text-slate-500 font-medium tracking-wide whitespace-nowrap">
                Scholarly Peer-Reviewed Journal Systems
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links with Stylish Animated Underline and Hover Effect */}
          <nav className="hidden lg:flex items-center space-x-2 xl:space-x-3 text-sm font-medium whitespace-nowrap flex-shrink-0">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative group px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive
                      ? 'text-blue-700 bg-blue-50/80 shadow-xs'
                      : 'text-slate-700 hover:text-blue-700 hover:bg-slate-100/70'
                  }`}
                >
                  {link.icon && (
                    <link.icon
                      className={`w-3.5 h-3.5 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'
                      }`}
                    />
                  )}
                  <span>{link.label}</span>
                  {/* Active / Hover Underline Glow */}
                  <span
                    className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-600 opacity-100 shadow-[0_0_8px_rgba(37,99,235,0.7)]'
                        : 'bg-blue-500 opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs & Auth */}
          <div className="hidden md:flex items-center space-x-3 xl:space-x-4 flex-shrink-0 whitespace-nowrap">
            <Link
              href="/submit"
              className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 rounded-md text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
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
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-700 hover:text-blue-700 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Sign In</span>
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
          <div className="lg:hidden border-t border-slate-200/80 py-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    {link.icon && <link.icon className="w-4 h-4 text-slate-400" />}
                    <span>{link.label}</span>
                  </span>
                  {isActive && <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded">Active</span>}
                </Link>
              );
            })}
            <Link
              href="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 bg-blue-700 text-white font-semibold px-3.5 py-2.5 rounded-lg text-sm shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit Manuscript</span>
            </Link>
            {status === 'authenticated' ? (
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <Link
                  href="/dashboard/author"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-md text-slate-700 hover:bg-slate-50 font-medium text-sm"
                >
                  Author Portal
                </Link>
                <Link
                  href="/dashboard/editor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-md text-slate-700 hover:bg-slate-50 font-medium text-sm"
                >
                  Editor Dashboard
                </Link>
                {isMasterAdmin && (
                  <Link
                    href="/dashboard/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3.5 py-2 rounded-md text-amber-800 hover:bg-amber-50 font-medium text-sm"
                  >
                    Admin Console
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-left px-3.5 py-2 rounded-md text-rose-600 hover:bg-rose-50 font-medium text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center mt-2 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
