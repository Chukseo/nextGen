import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { BookOpen, UploadCloud, ArrowRight, ShieldCheck, FileText, CheckCircle, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const journal = await prisma.journal.findUnique({
    where: { slug: params.slug },
    include: {
      editorialBoard: {
        include: { user: true },
        orderBy: { displayOrder: 'asc' },
      },
      volumes: {
        include: {
          issues: {
            where: { status: 'PUBLISHED' },
            include: {
              publishedArticles: {
                include: {
                  submission: {
                    include: { coAuthors: { orderBy: { authorOrder: 'asc' } } },
                  },
                },
              },
            },
            orderBy: { issueNumber: 'desc' },
          },
        },
        orderBy: { volumeNumber: 'desc' },
      },
    },
  });

  if (!journal) {
    notFound();
  }

  const allPublishedArticles = journal.volumes.flatMap((v) =>
    v.issues.flatMap((i) => i.publishedArticles)
  );

  return (
    <div className="space-y-12 pb-16">
      {/* Journal Masthead */}
      <div className="bg-navy-950 text-white py-12 px-4 sm:px-8 border-b border-navy-900">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded">
              {journal.slug.toUpperCase()}
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {journal.abbreviation}
            </span>
            <span className="text-xs text-emerald-300 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded font-medium">
              Open Access (CC BY 4.0)
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold scholarly-heading leading-tight">
            {journal.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed font-light">
            {journal.description}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              href={`/submit?journal=${journal.id}`}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded shadow transition-colors flex items-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit to {journal.abbreviation}</span>
            </Link>
            <div className="text-xs text-slate-400 flex items-center space-x-4">
              <span><strong>Print ISSN:</strong> {journal.printIssn || 'N/A'}</span>
              <span>•</span>
              <span><strong>Online ISSN:</strong> {journal.onlineIssn || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content: Aims & Published Articles */}
        <div className="lg:col-span-2 space-y-10">
          {/* Aims and Scope */}
          <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
              Aims and Scope
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed space-y-3 scholarly-abstract">
              <p>{journal.aimsScope}</p>
            </div>
          </section>

          {/* Published Articles in this Journal */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900 scholarly-heading">
                Published Research
              </h2>
              <span className="text-xs text-slate-500">{allPublishedArticles.length} Articles</span>
            </div>

            {allPublishedArticles.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
                Articles for the upcoming issue are currently completing production and review.
              </div>
            ) : (
              <div className="space-y-4">
                {allPublishedArticles.map((article) => {
                  const authors = article.submission.coAuthors
                    .map((a) => `${a.firstName} ${a.lastName}`)
                    .join(', ');

                  return (
                    <article
                      key={article.id}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        {article.doi && (
                          <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            DOI: {article.doi}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 scholarly-heading hover:text-blue-700">
                        <Link href={`/articles/${article.id}`}>{article.title}</Link>
                      </h3>

                      <p className="text-xs text-slate-600 font-medium">
                        {authors}
                      </p>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed scholarly-abstract">
                        {article.abstract}
                      </p>

                      <div className="pt-2 flex justify-end">
                        <Link
                          href={`/articles/${article.id}`}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <span>Full Article & PDF</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: Editorial Board & Policies */}
        <div className="space-y-8">
          {/* Editorial Board */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
              Editorial Board
            </h3>
            {journal.editorialBoard.length === 0 ? (
              <p className="text-xs text-slate-500">Board members under appointment.</p>
            ) : (
              <ul className="space-y-4">
                {journal.editorialBoard.map((member) => (
                  <li key={member.id} className="text-xs space-y-0.5 border-b border-slate-50 pb-3 last:border-none">
                    <div className="font-bold text-slate-900">{member.user.name}</div>
                    <div className="text-blue-700 font-semibold">{member.roleTitle}</div>
                    <div className="text-slate-500">{member.affiliation}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Publishing Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs text-slate-600">
            <h3 className="text-base font-bold text-slate-900 scholarly-heading border-b border-slate-100 pb-2">
              Journal Information
            </h3>
            <div className="space-y-2">
              <div>
                <span className="font-bold text-slate-900 block">Publisher</span>
                <span>{journal.publisher}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Peer Review Policy</span>
                <span>{journal.peerReviewPolicy}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Article Processing Charges</span>
                <span>{journal.apcInfo || 'None'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Editorial Inquiries</span>
                <span className="text-blue-700">{journal.contactEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
