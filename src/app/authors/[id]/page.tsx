import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getBaseUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: { id: string } };

async function getAuthor(id: string) {
  return prisma.submissionAuthor.findUnique({
    where: { id },
    include: {
      submission: {
        include: {
          publishedArticle: {
            include: { journal: true, issue: { include: { volume: true } } },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthor(params.id);
  if (!author?.submission.publishedArticle || author.submission.status !== 'PUBLISHED') {
    return { title: 'Author Not Found', robots: { index: false, follow: false } };
  }

  const name = `${author.firstName} ${author.lastName}`.trim();
  const canonical = `${getBaseUrl()}/authors/${author.id}`;
  return {
    title: name,
    description: `${name}${author.affiliation ? `, ${author.affiliation}` : ''}. Published research and citation links.`,
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export default async function AuthorPage({ params }: Props) {
  const author = await getAuthor(params.id);
  if (!author?.submission.publishedArticle || author.submission.status !== 'PUBLISHED') notFound();

  const name = `${author.firstName} ${author.lastName}`.trim();
  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/authors/${author.id}`;
  const articles = await prisma.publishedArticle.findMany({
    where: { submission: { status: 'PUBLISHED', coAuthors: { some: { id: author.id } } } },
    include: { journal: true, issue: { include: { volume: true } } },
    orderBy: { publishedAt: 'desc' },
  });
  const profileJsonLd = {
    '@context': 'https://schema.org', '@type': 'ProfilePage', url: canonical,
    mainEntity: {
      '@type': 'Person', name,
      ...(author.affiliation ? { affiliation: { '@type': 'Organization', name: author.affiliation } } : {}),
      ...(author.orcid ? { sameAs: [`https://orcid.org/${author.orcid}`] } : {}),
    },
  };

  return <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }} />
    <header className="border-b border-slate-200 pb-6">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest">Author profile</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 scholarly-heading">{name}</h1>
      {author.affiliation && <p className="mt-2 text-sm text-slate-600">{author.affiliation}{author.country ? `, ${author.country}` : ''}</p>}
      {author.bio && <p className="mt-4 text-sm leading-relaxed text-slate-700">{author.bio}</p>}
      {author.orcid && <a className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline" href={`https://orcid.org/${author.orcid}`} rel="me noreferrer" target="_blank">ORCID: {author.orcid}</a>}
    </header>
    <section aria-labelledby="published-articles">
      <h2 id="published-articles" className="text-xl font-bold text-slate-900 scholarly-heading">Published articles</h2>
      <ol className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
        {articles.map((article) => <li className="py-5" key={article.id}>
          <Link className="font-semibold text-blue-700 hover:underline" href={`/articles/${article.slug || article.id}`}>{article.title}</Link>
          <p className="mt-1 text-xs text-slate-600">{article.journal.title}. Vol. {article.issue.volume.volumeNumber}, No. {article.issue.issueNumber}, {new Date(article.publishedAt).getFullYear()}{article.pageRange ? `, pp. ${article.pageRange}` : ''}.</p>
          <div className="mt-2 flex gap-4 text-xs"><Link className="text-blue-700 hover:underline" href={`/articles/${article.slug || article.id}`}>Read article</Link><a className="text-blue-700 hover:underline" href={`/articles/${article.slug || article.id}/pdf`}>PDF</a>{article.doi && <a className="text-blue-700 hover:underline" href={`https://doi.org/${article.doi}`}>DOI</a>}</div>
        </li>)}
      </ol>
    </section>
  </div>;
}
