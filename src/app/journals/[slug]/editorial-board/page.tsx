import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import JournalHeader from '@/components/JournalHeader';
import { Users, Mail, ShieldCheck, CheckCircle2, Award, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalEditorialBoardPage({
  params,
}: {
  params: { slug: string };
}) {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
    include: {
      editorialBoard: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              affiliation: true,
              orcid: true,
              bio: true,
              country: true,
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!journal) {
    notFound();
  }

  // Categorize board members
  const eicList = journal.editorialBoard.filter(
    (m) => m.roleTitle.toLowerCase().includes('editor-in-chief') || m.roleTitle.toLowerCase().includes('chief')
  );
  const associateEditors = journal.editorialBoard.filter(
    (m) => m.roleTitle.toLowerCase().includes('associate') || m.roleTitle.toLowerCase().includes('section')
  );
  const otherBoard = journal.editorialBoard.filter(
    (m) => !eicList.includes(m) && !associateEditors.includes(m)
  );

  return (
    <div className="space-y-10 pb-16">
      {/* Journal Masthead & Subnav Menu */}
      <JournalHeader journal={journal} activeTab="editorial-board" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Column: Board Members */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 scholarly-heading">
              Editorial Board & Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              The editorial direction and academic integrity of {journal.title} are overseen by an international team of leading scholars and researchers.
            </p>
          </div>

          {journal.editorialBoard.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Editorial board appointments are currently in progress.
            </div>
          ) : (
            <div className="space-y-8">
              {/* Editor(s)-in-Chief */}
              {eicList.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-blue-100 pb-2">
                    <Award className="w-4 h-4 text-blue-700" />
                    <h3 className="text-base font-bold text-slate-900 scholarly-heading uppercase tracking-wide">
                      Editor-in-Chief
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {eicList.map((m) => (
                      <div
                        key={m.id}
                        className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-2 bg-gradient-to-br from-white to-blue-50/20"
                      >
                        <div className="font-bold text-base text-slate-900">
                          {m.user?.name || 'Editorial Member'}
                        </div>
                        <div className="text-xs font-semibold text-blue-700">
                          {m.roleTitle}
                        </div>
                        <div className="text-xs text-slate-600">
                          {m.affiliation || m.user?.affiliation}
                        </div>
                        {m.user?.orcid && (
                          <div className="text-[11px] font-mono text-emerald-700 pt-1">
                            ORCID: https://orcid.org/{m.user.orcid}
                          </div>
                        )}
                        {m.user?.bio && (
                          <p className="text-xs text-slate-500 pt-1 leading-relaxed italic">
                            {m.user.bio}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Associate & Section Editors */}
              {associateEditors.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    <h3 className="text-base font-bold text-slate-900 scholarly-heading uppercase tracking-wide">
                      Associate & Section Editors
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {associateEditors.map((m) => (
                      <div
                        key={m.id}
                        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2"
                      >
                        <div className="font-bold text-sm text-slate-900">
                          {m.user?.name || 'Editorial Member'}
                        </div>
                        <div className="text-xs font-semibold text-blue-700">
                          {m.roleTitle}
                        </div>
                        <div className="text-xs text-slate-600">
                          {m.affiliation || m.user?.affiliation}
                        </div>
                        {m.user?.orcid && (
                          <div className="text-[11px] font-mono text-emerald-700 pt-1">
                            ORCID: https://orcid.org/{m.user.orcid}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editorial Advisory Board */}
              {otherBoard.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    <h3 className="text-base font-bold text-slate-900 scholarly-heading uppercase tracking-wide">
                      Editorial Advisory Board
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherBoard.map((m) => (
                      <div
                        key={m.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1.5"
                      >
                        <div className="font-bold text-sm text-slate-900">
                          {m.user?.name || 'Editorial Member'}
                        </div>
                        <div className="text-xs font-semibold text-blue-700">
                          {m.roleTitle}
                        </div>
                        <div className="text-xs text-slate-600">
                          {m.affiliation || m.user?.affiliation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Editorial Guidelines & Responsibilities */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
              Editorial Policy
            </h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Independent Evaluation:</strong> Editorial decisions are made entirely on scientific merit, originality, and methodology rigour without commercial influence.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>COPE Guidelines:</strong> The board adheres to the Committee on Publication Ethics (COPE) Code of Conduct and Core Practices.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Double-Anonymous Review:</strong> Reviewer identities and author identities are protected to ensure impartial technical assessments.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-navy-950 text-white p-6 rounded-xl border border-navy-900 shadow-sm space-y-3">
            <h3 className="text-base font-bold scholarly-heading border-b border-slate-800 pb-2">
              Editorial Office Inquiries
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              For special issue proposals, appeals, or editorial correspondence with the Editor-in-Chief, contact:
            </p>
            <div className="pt-1 flex items-center space-x-2 text-xs font-semibold text-blue-400">
              <Mail className="w-4 h-4" />
              <span>{journal.contactEmail}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
