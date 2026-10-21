import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        // Allow all crawlers general access; block private areas
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/admin/', '/admin/setup', '/api/auth/'],
      },
      {
        // Google Scholar & major search bots — explicitly allow article PDFs
        userAgent: ['Googlebot', 'Google-Scholar', 'bingbot', 'Slurp', 'DuckDuckBot', 'archive.org_bot'],
        allow: [
          '/',
          '/articles/',
          '/journals/',
          '/issues/',
          '/api/articles/',   // needed for citation_pdf_url discovery
        ],
        disallow: ['/dashboard/', '/api/admin/', '/api/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
