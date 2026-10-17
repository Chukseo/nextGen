'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Share2,
  Quote,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  BookOpen,
  FileText,
  CheckCircle,
  Eye,
  ArrowLeft
} from 'lucide-react';
import CitationModal from '@/components/CitationModal';

export default function ArticleDetailClient({
  article,
  manuscriptBlocks,
}: {
  article: any;
  manuscriptBlocks?: any[] | null;
}) {
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [downloadsCount, setDownloadsCount] = useState<number>(article.downloadsCount || 0);

  const publicationYear = new Date(article.publishedAt).getFullYear();
  const authors = article.submission.coAuthors;

  const citationData = {
    title: article.title,
    journalTitle: article.journal.title,
    volumeNumber: article.issue?.volume?.volumeNumber,
    issueNumber: article.issue?.issueNumber,
    year: publicationYear,
    pages: article.pageRange,
    doi: article.doi,
    authors: authors.map((a: any) => ({ firstName: a.firstName, lastName: a.lastName })),
  };

  const downloadUrl = `/api/articles/${article.id}/pdf`;

  const handleDownloadClick = () => {
    setDownloadsCount((prev) => prev + 1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-10">
      {/* Back Link & Journal Banner */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          {article.journal?.coverImageUrl && (
            <Link href={`/journals/${article.journal.slug}`} className="flex-shrink-0">
              <div className="w-12 h-16 rounded overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                <img
                  src={article.journal.coverImageUrl}
                  alt={article.journal.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          )}
          <Link
            href={`/journals/${article.journal.slug}`}
            className="hover:text-blue-700 flex items-center space-x-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{article.journal.title}</span>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <span>Vol. {article.issue?.volume?.volumeNumber || 1}, No. {article.issue?.issueNumber || 1} ({publicationYear})</span>
          <span>•</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
            Open Access
          </span>
        </div>
      </div>

      {/* Main Article Header */}
      <div className="space-y-6">
        <div className="space-y-3">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            {article.submission.articleType.replace('_', ' ')}
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-navy-950 scholarly-heading leading-tight">
            {article.title}
          </h1>
          {article.submission.subtitle && (
            <p className="text-base sm:text-lg text-slate-600 font-light italic">
              {article.submission.subtitle}
            </p>
          )}
        </div>

        {/* Authors and Affiliations */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-800">
            {authors.map((author: any, idx: number) => (
              <span key={author.id} className="inline-flex items-center">
                <span>{author.firstName} {author.lastName}</span>
                <sup className="text-blue-700 ml-0.5 font-bold">{idx + 1}</sup>
                {author.isCorresponding && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1 ml-1 rounded">
                    Corresponding
                  </span>
                )}
                {author.orcid && (
                  <a
                    href={`https://orcid.org/${author.orcid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 text-[#a6ce39] hover:opacity-80"
                    title={`ORCID: ${author.orcid}`}
                  >
                    iD
                  </a>
                )}
                {idx < authors.length - 1 && <span className="text-slate-400 ml-2">,</span>}
              </span>
            ))}
          </div>

          <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
            {authors.map((author: any, idx: number) => (
              <div key={author.id} className="flex items-start space-x-2">
                <sup className="font-bold text-blue-700">{idx + 1}</sup>
                <span>{author.affiliation}{author.country ? `, ${author.country}` : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Persistent Identifiers & Metrics Bar */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            {article.doi && (
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">Crossref DOI:</span>
                <a
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-blue-700 hover:underline flex items-center space-x-1"
                >
                  <span>https://doi.org/{article.doi}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  {article.doiStatus}
                </span>
              </div>
            )}
            <div className="text-slate-500 flex flex-wrap items-center gap-3">
              <span>Published: {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span>Peer-Reviewed</span>
              <span>•</span>
              <span className="inline-flex items-center space-x-1.5 font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>{downloadsCount} {downloadsCount === 1 ? 'Download' : 'Downloads'}</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>{article.viewsCount || 0} {article.viewsCount === 1 ? 'View' : 'Views'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCitationModalOpen(true)}
              className="inline-flex items-center space-x-1.5 py-2 px-3.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-md font-semibold text-slate-700 shadow-sm transition-colors"
            >
              <Quote className="w-4 h-4 text-blue-700" />
              <span>Cite</span>
            </button>

            <a
              href={downloadUrl}
              download
              onClick={handleDownloadClick}
              className="inline-flex items-center space-x-1.5 py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>
      </div>

      {/* Abstract Section */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-navy-950 scholarly-heading border-b border-slate-100 pb-2">
          Abstract
        </h2>
        <div className="text-sm text-slate-800 leading-relaxed scholarly-abstract text-justify">
          {article.abstract}
        </div>

        {article.keywords && article.keywords.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase mr-2">Keywords:</span>
            <div className="inline-flex flex-wrap gap-1.5">
              {article.keywords.map((k: any) => (
                <span
                  key={k.id}
                  className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded font-medium"
                >
                  {k.keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Full Manuscript Body (Headings, Paragraphs, Tables, and Lists) */}
      {manuscriptBlocks && manuscriptBlocks.length > 0 && (
        <section className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold text-navy-950 scholarly-heading">
              Full Text Article
            </h2>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded">
              Peer-Reviewed Manuscript
            </span>
          </div>

          <div className="space-y-5 text-sm text-slate-800 leading-relaxed scholarly-article-body">
            {manuscriptBlocks.map((block: any, idx: number) => {
              if (block.type === 'heading') {
                if (block.level === 1) {
                  return (
                    <h2
                      key={idx}
                      className="text-xl sm:text-2xl font-bold text-navy-950 scholarly-heading pt-6 pb-2 border-b border-slate-100"
                    >
                      {block.text}
                    </h2>
                  );
                }
                return (
                  <h3
                    key={idx}
                    className="text-base sm:text-lg font-bold text-slate-900 scholarly-heading pt-4 pb-1"
                  >
                    {block.text}
                  </h3>
                );
              }

              if (block.type === 'table') {
                return (
                  <div key={idx} className="my-6 space-y-2">
                    {block.caption && (
                      <div className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                        {block.caption}
                      </div>
                    )}
                    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <tbody>
                          {block.rows.map((row: any, rIdx: number) => {
                            const isHeader = rIdx === 0 || row.cells.some((c: any) => c.isHeader);
                            return (
                              <tr
                                key={rIdx}
                                className={
                                  isHeader
                                    ? 'bg-slate-100 font-bold text-navy-950 border-b-2 border-slate-300'
                                    : rIdx % 2 === 1
                                    ? 'bg-slate-50/60 text-slate-800 border-b border-slate-200'
                                    : 'bg-white text-slate-800 border-b border-slate-200'
                                }
                              >
                                {row.cells.map((cell: any, cIdx: number) => {
                                  const CellTag = isHeader ? 'th' : 'td';
                                  return (
                                    <CellTag
                                      key={cIdx}
                                      className="py-2.5 px-3.5 border-r border-slate-200 last:border-r-0 align-top"
                                    >
                                      {cell.text}
                                    </CellTag>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              if (block.type === 'list_item') {
                return (
                  <div key={idx} className="flex items-start space-x-2.5 pl-4 text-slate-700 text-sm">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{block.text}</span>
                  </div>
                );
              }

              return (
                <p key={idx} className="text-justify text-slate-800 leading-relaxed text-sm">
                  {block.text}
                </p>
              );
            })}
          </div>
        </section>
      )}

      {/* Declarations & Ethics Statement */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700">
        <h2 className="text-base font-bold text-navy-950 scholarly-heading border-b border-slate-100 pb-2">
          Declarations & Editorial Statements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Conflict of Interest</h4>
            <p className="text-slate-600">{article.submission.conflictOfInterest || 'The authors declare no competing financial or non-financial interests.'}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Funding Information</h4>
            <p className="text-slate-600">{article.submission.fundingInfo || 'No external research grant was declared for this project.'}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Data Availability Statement</h4>
            <p className="text-slate-600">{article.submission.dataAvailability || 'Data sharing is not applicable or research artifacts are publicly archived as cited in the text.'}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Publishing License</h4>
            <p className="text-slate-600">
              Published under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="text-blue-700 underline font-semibold">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>. Authors retain copyright.
            </p>
          </div>
        </div>
      </section>

      {/* Bibliographic References Section */}
      {article.references && article.references.length > 0 && (
        <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-navy-950 scholarly-heading border-b border-slate-100 pb-2">
            References ({article.references.length})
          </h2>
          <ol className="list-decimal pl-5 space-y-3 text-xs text-slate-700">
            {article.references.map((ref: any) => (
              <li key={ref.id} className="leading-relaxed">
                <span>{ref.rawText}</span>
                {ref.doi && (
                  <span className="block mt-0.5">
                    <a
                      href={`https://doi.org/${ref.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline font-mono"
                    >
                      https://doi.org/{ref.doi}
                    </a>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Citation Modal */}
      {citationModalOpen && (
        <CitationModal
          data={citationData}
          onClose={() => setCitationModalOpen(false)}
        />
      )}
    </div>
  );
}
