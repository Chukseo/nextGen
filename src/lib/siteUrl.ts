/**
 * Centralized site URL helper.
 * Ensures consistent canonical URLs across SEO metadata, sitemaps, robots.txt,
 * Google Scholar citation tags, and PDF generation.
 */
export function getBaseUrl(): string {
  // 1. Explicit environment variable (NEXT_PUBLIC_SITE_URL or NEXTAUTH_URL)
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    let clean = envUrl.replace(/\/+$/, '');
    if (clean === 'http://nextgenuk.online' || clean === 'http://www.nextgenuk.online') {
      clean = 'https://nextgenuk.online';
    }
    if (clean === 'https://www.nextgenuk.online') {
      clean = 'https://nextgenuk.online';
    }
    return clean;
  }

  // 2. Vercel production domain
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    const vDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, '');
    return `https://${vDomain}`;
  }
  if (process.env.VERCEL_URL) {
    const vUrl = process.env.VERCEL_URL.replace(/\/+$/, '');
    return `https://${vUrl}`;
  }

  // 3. Canonical live production domain
  return 'https://nextgenuk.online';
}
