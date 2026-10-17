import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://nextgen-press.org';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/admin/', '/admin/setup'],
      },
      {
        userAgent: ['Googlebot', 'Google-Scholar', 'bingbot', 'archive.org_bot'],
        allow: ['/', '/articles/', '/journals/', '/issues/', '/api/articles/'],
        disallow: ['/dashboard/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
