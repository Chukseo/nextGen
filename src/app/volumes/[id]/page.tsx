import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getBaseUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const volume = await prisma.volume.findUnique({ where: { id: params.id }, include: { journal: true } });
  if (!volume) return { title: 'Volume Not Found', robots: { index: false, follow: false } };
  const title = `${volume.journal.title}, Volume ${volume.volumeNumber} (${volume.year})`;
  return { title, description: `Issues and published articles in ${title}.`, alternates: { canonical: `${getBaseUrl()}/volumes/${volume.id}` } };
}

export default async function VolumePage({ params }: Props) {
  const volume = await prisma.volume.findUnique({ where: { id: params.id }, include: { journal: true, issues: { where: { status: 'PUBLISHED' }, include: { publishedArticles: { include: { submission: { include: { coAuthors: { orderBy: { authorOrder: 'asc' } } } } } } }, orderBy: { issueNumber: 'desc' } } } });
  if (!volume) notFound();
  const url = `${getBaseUrl()}/volumes/${volume.id}`;
  const jsonLd = { '@context': 'https://schema.org', '@type': 'PublicationVolume', volumeNumber: String(volume.volumeNumber), datePublished: `${volume.year}-01-01`, url, isPartOf: { '@type': 'Periodical', name: volume.journal.title, ...(volume.journal.onlineIssn ? { issn: volume.journal.onlineIssn } : {}) } };
  return <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><header><p className="text-xs font-semibold text-blue-700 uppercase tracking-widest">{volume.journal.title}</p><h1 className="mt-2 text-3xl font-bold scholarly-heading">Volume {volume.volumeNumber} ({volume.year})</h1></header><section className="divide-y divide-slate-200 border-y border-slate-200">{volume.issues.map((issue) => <article className="py-5" key={issue.id}><Link className="font-semibold text-blue-700 hover:underline" href={`/issues/${issue.id}`}>Issue {issue.issueNumber}: {issue.title}</Link><p className="mt-2 text-sm text-slate-600">{issue.publishedArticles.length} published articles</p><ul className="mt-3 space-y-2">{issue.publishedArticles.map((article) => <li key={article.id}><Link className="text-sm text-slate-700 hover:text-blue-700 hover:underline" href={`/articles/${article.slug || article.id}`}>{article.title}</Link></li>)}</ul></article>)}</section></div>;
}
