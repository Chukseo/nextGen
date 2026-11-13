'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  GraduationCap,
  Award,
} from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const roles = (session?.user as any)?.roles || [];
  const isMasterAdmin = roles.some((r: any) => r.role === 'MASTER_ADMIN');
  const isEditor = roles.some((r: any) => r.role === 'EDITOR' || r.role === 'JOURNAL_MANAGER');
  const isReviewer = roles.some((r: any) => r.role === 'REVIEWER');

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/journals', label: 'Journals' },
    { href: '/articles', label: 'Search Research', icon: Search },
    { href: '/about', label: 'About' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'shadow-[0_6px_40px_rgba(15,23,42,0.09)] bg-[rgba(255,253,250,0.97)] backdrop-blur-[32px] saturate-200'
          : 'shadow-[0_4px_32px_rgba(15,23,42,0.05)] bg-[rgba(255,253,250,0.84)] backdrop-blur-[28px] saturate-180'
      } border-b border-white/55`}
      style={{ WebkitBackdropFilter: scrolled ? 'blur(32px) saturate(200%)' : 'blur(28px) saturate(180%)' }}
    >
      {/* Top Organisation Strip */}
      <div className="bg-navy-950 text-slate-300 text-xs py-1.5 px-4 sm:px-6 lg:px-10 border-b border-navy-900">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <span className="font-semibold text-white tracking-wide uppercase text-[10px] sm:text-xs">
              Open Access Academic Publisher
            </span>
            <span className="text-navy-700 hidden md:inline">•</span>
            <span className="hidden md:inline text-blue-300 font-medium flex items-center gap-1">
              <GraduationCap className="w-3 h-3 inline-block opacity-80" />
              Affiliated with UCL
            </span>
            <span className="text-navy-700 hidden lg:inline">•</span>
            <span className="hidden lg:inline text-emerald-300 font-medium flex items-center gap-1">
              <Award className="w-3 h-3 inline-block opacity-80" />
              In Partnership with LOU Publishing
            </span>
            <span className="text-navy-700 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-400">Gower Street, London, UK</span>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link href="/contact" className="hover:text-blue-300 transition-colors duration-200">
              Contact Office
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/editorial-policies" className="hover:text-white transition-colors duration-200">
              Publication Ethics
            </Link>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex justify-between items-center h-[72px] w-full gap-4 xl:gap-8 flex-nowrap">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm scale-110" />
              <img
                src="/logo.png"
                alt="NextGen Innovation & Research Journals"
                className="h-11 sm:h-12 w-auto object-contain transition-transform duration-400 group-hover:scale-105 relative z-10"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-[15px] xl:text-[17px] font-bold text-navy-950 scholarly-heading tracking-tight leading-tight whitespace-nowrap transition-colors duration-200 group-hover:text-blue-700">
                NextGen Innovation &amp; Research Journals
              </div>
              <div className="text-[10px] xl:text-[11px] text-slate-400 font-medium tracking-wide whitespace-nowrap">
                Affiliated with UCL&nbsp;&bull;&nbsp;In Partnership with LOU Publishing&nbsp;&bull;&nbsp;Gower Street, London
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium whitespace-nowrap flex-shrink-0">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative group px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-250 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-blue-700 bg-blue-50/90'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100/80'
                  }`}
                >
                  {link.icon && (
                    <link.icon
                      className={`w-3.5 h-3.5 transition-colors duration-200 ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                      }`}
                    />
                  )}
                  <span>{link.label}</span>

                  {/* Animated underline */}
                  <span
                    className={`absolute bottom-1 left-3 right-3 h-[2px] rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-600 opacity-100 scale-x-100 shadow-[0_0_8px_rgba(37,99,235,0.6)]'
                        : 'bg-blue-500 opacity-0 scale-x-0 group-hover:opacity-80 group-hover:scale-x-100'
                    }`}
                    style={{ transformOrigin: 'left' }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* CTA + Auth */}
          <div className="hidden md:flex items-center gap-3 xl:gap-4 flex-shrink-0 whitespace-nowrap">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-blue-500/25 hover:shadow-lg btn-shimmer btn-magnetic transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit Manuscript</span>
            </Link>

            {status === 'authenticated' ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 border border-slate-200/80 hover:border-blue-300 rounded-full py-1.5 px-3 text-sm text-slate-700 bg-white/70 backdrop-blur-sm transition-all duration-250 hover:shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[110px] truncate font-medium text-sm">
                    {session.user?.name || session.user?.email}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-250 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 glass-card rounded-2xl py-2 z-50 animate-slide-up border border-white/60">
                    <div className="px-4 py-2.5 border-b border-slate-100/80">
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{session.user?.email}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
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
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-50/80 font-medium transition-colors rounded-lg mx-1"
                        >
                          <Shield className="w-4 h-4 text-amber-500" />
                          <span>Master Admin Console</span>
                        </Link>
                      )}
                      {(isEditor || isMasterAdmin) && (
                        <Link
                          href="/dashboard/editor"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50/80 transition-colors rounded-lg mx-1"
                        >
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span>Editorial Dashboard</span>
                        </Link>
                      )}
                      {(isReviewer || isMasterAdmin) && (
                        <Link
                          href="/dashboard/reviewer"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50/80 transition-colors rounded-lg mx-1"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Reviewer Center</span>
                        </Link>
                      )}
                      <Link
                        href="/dashboard/author"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50/80 transition-colors rounded-lg mx-1"
                      >
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Author Portal</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100/80 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50/80 transition-colors rounded-lg mx-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-700 px-3 py-2 rounded-xl hover:bg-slate-100/80 transition-all duration-200"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-navy-950 hover:bg-slate-100/80 rounded-xl transition-all duration-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen
                ? <X className="w-5 h-5" />
                : <Menu className="w-5 h-5" />
              }
            </button>
          </div>
        </div>

        {/* Mobile Drawer — smooth slide down */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileMenuOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-slate-200/60 py-4 space-y-1.5">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 pl-3'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {link.icon && <link.icon className="w-4 h-4 text-slate-400" />}
                    <span>{link.label}</span>
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </Link>
              );
            })}

            <Link
              href="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm btn-shimmer mt-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit Manuscript</span>
            </Link>

            {status === 'authenticated' ? (
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <Link
                  href="/dashboard/author"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  <User className="w-4 h-4 text-indigo-500" />
                  Author Portal
                </Link>
                <Link
                  href="/dashboard/editor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  Editor Dashboard
                </Link>
                {isMasterAdmin && (
                  <Link
                    href="/dashboard/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-amber-800 hover:bg-amber-50 font-medium text-sm transition-colors"
                  >
                    <Shield className="w-4 h-4 text-amber-500" />
                    Admin Console
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-left flex items-center gap-2 px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-medium text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 mt-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4" />
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
