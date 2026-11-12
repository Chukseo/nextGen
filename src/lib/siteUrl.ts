/**
 * Centralized site URL helper.
 * Ensures consistent canonical URLs across SEO metadata, sitemaps, robots.txt,
 * Google Scholar citation tags, and PDF generation.
 *
 * Strict policy: Always prefer non-www https://nextgenuk.online in production.
 */
export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;

  // Local development check
  if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return envUrl.replace(/\/+$/, '');
  }

  // Live production canonical domain is always non-www https://nextgenuk.online
  return 'https://nextgenuk.online';
}
