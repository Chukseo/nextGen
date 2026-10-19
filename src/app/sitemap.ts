import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://nextgen-press.org';

  // 1. Static high-level routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/journals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/issues`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/editorial-policies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // 2. Dynamic Journal Routes & Subpages
    const journals = await prisma.journal.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const journalRoutes: MetadataRoute.Sitemap = journals.flatMap((j) => [
      {
        url: `${baseUrl}/journals/${j.slug}`,
        lastModified: j.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.85,
      },
      {
        url: `${baseUrl}/journals/${j.slug}/current`,
        lastModified: j.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.85,
      },
      {
        url: `${baseUrl}/journals/${j.slug}/archive`,
        lastModified: j.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      },
      {
        url: `${baseUrl}/journals/${j.slug}/editorial-board`,
        lastModified: j.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/journals/${j.slug}/guidelines`,
        lastModified: j.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      },
      {
        url: `${baseUrl}/journals/${j.slug}/privacy`,
        lastModified: j.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.65,
      },
      {
        url: `${baseUrl}/journals/${j.slug}/contact`,
        lastModified: j.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.65,
      },
    ]);

    // 3. Published Articles for Google Scholar Harvesting
    const articles = await prisma.publishedArticle.findMany({
      where: {
        submission: { status: 'PUBLISHED' },
      },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
    });

    const articleRoutes: MetadataRoute.Sitemap = articles.map((art) => ({
      url: `${baseUrl}/articles/${art.slug || art.id}`,
      lastModified: art.updatedAt || art.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    }));

    // 4. Published Issues
    const issues = await prisma.issue.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, updatedAt: true },
    });

    const issueRoutes: MetadataRoute.Sitemap = issues.map((iss) => ({
      url: `${baseUrl}/issues/${iss.id}`,
      lastModified: iss.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...journalRoutes, ...issueRoutes, ...articleRoutes];
  } catch (err) {
    console.warn('Sitemap generation database query fallback:', err);
    return staticRoutes;
  }
}
