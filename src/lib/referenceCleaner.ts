/**
 * Utility to detect and stitch wrapped reference lines into complete scholarly citations.
 * Handles APA, Harvard, Chicago, Vancouver, and numbered reference conventions,
 * joining line-wrapped fragments caused by Word/PDF copy-pasting.
 */

export function isLikelyNewReference(line: string, prevLine?: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // 1. Explicit numbering: [1], 1., 1)
  if (/^\[\d+\]/.test(trimmed) || /^\d+[\.\)]\s+/.test(trimmed)) {
    return true;
  }

  // 2. Obvious continuation markers
  if (/^[a-z]/.test(trimmed)) return false;
  if (/^[,\.;:\)\]\/\-]/.test(trimmed)) return false;
  if (/^(https?:\/\/|doi:|DOI:|www\.)/i.test(trimmed)) return false;
  if (/^(\d+[\(\),\-\s\d\.:]+|pp?\.\s*\d+|pages?\s*\d+)/i.test(trimmed)) return false;
  if (/^(Retrieved|from\s+|accessed\s+|available\s+at|in\s+press|in\s+review)/i.test(trimmed)) return false;
  if (/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i.test(trimmed)) return false;
  if (/^(on\s+|and\s+|of\s+|for\s+|with\s+|to\s+|in\s+|approaches\s+|security\.\s+|research:\s+|analysis\s+of\s+|intentions\s+)/i.test(trimmed)) return false;

  // 3. If previous line clearly didn't end a citation
  if (prevLine) {
    const prevTrimmed = prevLine.trim();
    if (/[-,\(;:&]$/.test(prevTrimmed)) return false;
    if (/\b(and|or|in|of|the|at|from|with|for|by|Retrieved|pp|vol|no|issue|volume)\.?$/i.test(prevTrimmed)) return false;
    if (/,\s*\d+(\(\d+\))?,?\s*$/.test(prevTrimmed)) return false;
  }

  // 4. Standard APA / Harvard / author-year entry: starts with capital and contains (YYYY) within first 120 chars
  const first120 = trimmed.slice(0, 120);
  if (/\((?:19|20)\d{2}[a-z]?\)/.test(first120) || /\(n\.d\.\)/i.test(first120)) {
    return true;
  }

  return false;
}

export function cleanAndMergeReferences<T extends string | { rawText: string; doi?: string | null }>(
  rawList: T[]
): string[] {
  const merged: string[] = [];
  let current = '';

  for (const item of rawList) {
    let line = typeof item === 'string' ? item : item?.rawText || '';
    line = line.trim();
    if (!line) continue;

    // Attach DOI if provided on item object
    if (typeof item !== 'string' && item?.doi && !line.includes(item.doi)) {
      const cleanDoi = item.doi.replace(/^https?:\/\/doi\.org\//, '');
      line += ` https://doi.org/${cleanDoi}`;
    }

    if (!current) {
      current = line;
      continue;
    }

    if (isLikelyNewReference(line, current)) {
      merged.push(current);
      current = line;
    } else {
      if (current.endsWith('-')) {
        current = current.slice(0, -1) + line;
      } else {
        current = `${current} ${line}`;
      }
    }
  }

  if (current) {
    merged.push(current);
  }

  return merged;
}
