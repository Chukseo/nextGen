import prisma from './prisma';

/**
 * Converts a string into a clean, URL-safe slug.
 */
export function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric except spaces and hyphens
    .trim()
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores to single hyphen
    .replace(/^-+|-+$/g, '') // trim leading and trailing hyphens
    .slice(0, 90); // keep clean length for SEO URLs
}

/**
 * Generates a collision-free unique slug for PublishedArticle.
 */
export async function generateUniqueArticleSlug(
  title: string,
  client: any = prisma,
  excludeArticleId?: string
): Promise<string> {
  const baseSlug = slugify(title) || 'article';
  let candidateSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await client.publishedArticle.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    if (!existing || (excludeArticleId && existing.id === excludeArticleId)) {
      return candidateSlug;
    }

    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }
}
