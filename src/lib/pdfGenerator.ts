import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import mammoth from 'mammoth';
import { getBaseUrl } from './siteUrl';

export interface TableCell {
  text: string;
  isHeader?: boolean;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableBlock {
  type: 'table';
  caption?: string;
  rows: TableRow[];
}

export interface HeadingBlock {
  type: 'heading';
  level: number;
  text: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface ListItemBlock {
  type: 'list_item';
  text: string;
}

export type ManuscriptContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | TableBlock
  | ListItemBlock;

export interface ScholarlyPdfData {
  journalTitle: string;
  journalAbbreviation: string;
  journalSlug?: string | null;
  journalUrl?: string | null;
  onlineIssn?: string | null;
  printIssn?: string | null;
  volumeNumber: number;
  issueNumber: number;
  year: number;
  articleNumber?: string | null;
  pageRange?: string | null;
  doi: string;
  articleType: string;
  title: string;
  abstract: string;
  keywords?: string[];
  manuscriptFullText?: string | null;
  manuscriptBlocks?: ManuscriptContentBlock[] | null;
  declarations?: {
    label: string;
    text?: string | null;
  }[];
  references?: {
    orderIndex: number;
    rawText: string;
    doi?: string | null;
  }[];
  publishedAt: Date;
  receivedAt?: Date | null;
  acceptedAt?: Date | null;
  citationString?: string;
  license?: string;
  authors: {
    firstName: string;
    lastName: string;
    affiliation?: string | null;
    orcid?: string | null;
    isCorresponding?: boolean;
    email?: string | null;
  }[];
}

// Set of valid Windows-1252 code points outside 0x20..0x7E and 0xA0..0xFF
const WIN1252_EXTRA_CODES = new Set([
  0x20AC, // €
  0x201A, // ‚
  0x0192, // ƒ
  0x201E, // „
  0x2026, // …
  0x2020, // †
  0x2021, // ‡
  0x02C6, // ˆ
  0x2030, // ‰
  0x0160, // Š
  0x2039, // ‹
  0x0152, // Œ
  0x017D, // Ž
  0x2018, // ‘
  0x2019, // ’
  0x201C, // “
  0x201D, // ”
  0x2022, // •
  0x2013, // –
  0x2014, // —
  0x02DC, // ˜
  0x2122, // ™
  0x0161, // š
  0x203A, // ›
  0x0153, // œ
  0x017E, // ž
  0x0178, // Ÿ
]);

// Thoroughly sanitize text for PDF-lib StandardFonts (WinAnsi / Windows-1252 encoding)
export function sanitizeForPdf(text: string): string {
  if (!text) return '';

  // 1. Map common Cyrillic homoglyphs and transliterations that often get pasted from Word
  let s = text
    .replace(/\u0430/g, 'a').replace(/\u0410/g, 'A')
    .replace(/\u0435/g, 'e').replace(/\u0415/g, 'E')
    .replace(/\u043e/g, 'o').replace(/\u041e/g, 'O')
    .replace(/\u0440/g, 'p').replace(/\u0420/g, 'P')
    .replace(/\u0441/g, 'c').replace(/\u0421/g, 'C')
    .replace(/\u0443/g, 'y').replace(/\u0423/g, 'Y')
    .replace(/\u0445/g, 'x').replace(/\u0425/g, 'X')
    .replace(/\u0456/g, 'i').replace(/\u0406/g, 'I')
    .replace(/\u0458/g, 'j').replace(/\u0408/g, 'J')
    .replace(/\u0455/g, 's').replace(/\u0405/g, 'S')
    .replace(/\u0412/g, 'B').replace(/\u041d/g, 'H')
    .replace(/\u041a/g, 'K').replace(/\u041c/g, 'M')
    .replace(/\u0422/g, 'T');

  // 2. Map typographic symbols, smart quotes, dashes, and mathematical operators
  s = s
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u2260]/g, '!=')
    .replace(/[\u00D7]/g, 'x')
    .replace(/[\u00F7]/g, '/')
    .replace(/[\u2248\u223C]/g, '~')
    .replace(/[\u2192]/g, '->')
    .replace(/[\u2190]/g, '<-')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-');

  // 3. Scan characters and verify against WinAnsi
  let result = '';
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    const code = char.charCodeAt(0);

    // Standard printable ASCII
    if (code >= 0x20 && code <= 0x7E) {
      result += char;
      continue;
    }
    // Newline / Tab
    if (code === 0x0A || code === 0x0D || code === 0x09) {
      result += ' ';
      continue;
    }
    // Latin-1 Supplement (0xA0 - 0xFF)
    if (code >= 0x00A0 && code <= 0x00FF) {
      result += char;
      continue;
    }
    // Extra WinAnsi codes
    if (WIN1252_EXTRA_CODES.has(code)) {
      result += char;
      continue;
    }

    // Try NFKD decomposition to map diacritics
    const decomposed = char.normalize('NFKD');
    let mapped = false;
    for (let j = 0; j < decomposed.length; j++) {
      const dCode = decomposed.charCodeAt(j);
      if (dCode >= 0x20 && dCode <= 0x7E) {
        result += decomposed[j];
        mapped = true;
        break;
      }
    }
    if (!mapped) {
      result += ' '; // Safely replace unknown glyph with space
    }
  }

  return result.replace(/\s+/g, ' ').trim();
}

// Utility to wrap text into lines fitting a maxWidth
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  if (!text) return [];
  const sanitized = sanitizeForPdf(text);

  const words = sanitized.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let testWidth = 0;
    try {
      testWidth = font.widthOfTextAtSize(testLine, fontSize);
    } catch {
      testWidth = testLine.length * (fontSize * 0.55);
    }

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Check if a line is likely an academic section heading
function isSectionHeading(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length > 70 || trimmed.length < 3) return false;
  const headingRegex = /^(\d+(\.\d+)*\s+)?(introduction|background|literature review|methodology|methods|materials and methods|experimental setup|system design|implementation|results|findings|discussion|evaluation|conclusion|conclusions|future work|related work|declarations|references|acknowledgements|author contributions)/i;
  if (headingRegex.test(trimmed)) return true;
  if (trimmed === trimmed.toUpperCase() && trimmed.length < 35 && /[A-Z]/.test(trimmed)) return true;
  return false;
}

// Clean HTML tags and decode HTML entities while preserving spacing
function cleanHtmlText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/td>/gi, ' ')
    .replace(/<\/th>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse HTML output from Mammoth into structured document blocks
export function parseHtmlToBlocks(html: string): ManuscriptContentBlock[] {
  const blocks: ManuscriptContentBlock[] = [];
  if (!html || !html.trim()) return blocks;

  // Match top-level tags: table, p, h1-h6, ul, ol, blockquote
  const tagRegex = /<(table|p|h[1-6]|ul|ol|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2];

    if (tag === 'table') {
      const rows: TableRow[] = [];
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let trMatch: RegExpExecArray | null;

      while ((trMatch = trRegex.exec(inner)) !== null) {
        const trInner = trMatch[1];
        const cells: TableCell[] = [];
        const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
        let cellMatch: RegExpExecArray | null;

        while ((cellMatch = cellRegex.exec(trInner)) !== null) {
          const isHeader = cellMatch[1].toLowerCase() === 'th';
          const cellText = cleanHtmlText(cellMatch[2]);
          cells.push({ text: cellText, isHeader });
        }

        if (cells.length > 0) {
          rows.push({ cells });
        }
      }

      if (rows.length > 0) {
        blocks.push({ type: 'table', rows });
      }
    } else if (tag.startsWith('h')) {
      const level = parseInt(tag[1], 10) || 2;
      const text = cleanHtmlText(inner);
      if (text) {
        blocks.push({ type: 'heading', level, text });
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(inner)) !== null) {
        const text = cleanHtmlText(liMatch[1]);
        if (text) {
          blocks.push({ type: 'list_item', text });
        }
      }
    } else if (tag === 'p' || tag === 'blockquote') {
      const text = cleanHtmlText(inner);
      if (text) {
        // If it's a table caption (e.g. "Table 1: Overall Results")
        if (/^(table|tab\.)\s+\d+[:.]/i.test(text)) {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.type === 'table' && !lastBlock.caption) {
            lastBlock.caption = text;
            continue;
          }
        }

        if (isSectionHeading(text)) {
          blocks.push({ type: 'heading', level: 2, text });
        } else {
          blocks.push({ type: 'paragraph', text });
        }
      }
    }
  }

  // Associate preceding table caption with subsequent table
  for (let i = 0; i < blocks.length - 1; i++) {
    const cur = blocks[i];
    const next = blocks[i + 1];
    if (cur.type === 'paragraph' && /^(table|tab\.)\s+\d+[:.]/i.test(cur.text) && next.type === 'table' && !next.caption) {
      next.caption = cur.text;
      blocks.splice(i, 1);
      i--;
    }
  }

  return blocks;
}

// Parse plain text or markdown tables into structured document blocks
export function parseTextToBlocks(rawText: string): ManuscriptContentBlock[] {
  const blocks: ManuscriptContentBlock[] = [];
  if (!rawText || !rawText.trim()) return blocks;

  const lines = rawText.split(/\r?\n/).map(l => l.trim());
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line) {
      i++;
      continue;
    }

    // Check for markdown table: e.g. | col1 | col2 |
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableRows: TableRow[] = [];
      let caption: string | undefined;

      // Check if previous block was a table caption
      const prevBlock = blocks[blocks.length - 1];
      if (prevBlock && prevBlock.type === 'paragraph' && /^(table|tab\.)\s+\d+[:.]/i.test(prevBlock.text)) {
        caption = prevBlock.text;
        blocks.pop();
      }

      while (i < lines.length && lines[i].startsWith('|') && lines[i].endsWith('|')) {
        const curLine = lines[i];
        // Skip markdown separator line: |---|---|
        if (/^\|(\s*[-:]+[-|\s:]*)\|$/.test(curLine)) {
          i++;
          continue;
        }

        const rawCells = curLine
          .slice(1, -1)
          .split('|')
          .map(c => c.trim());

        const isHeader = tableRows.length === 0;
        tableRows.push({
          cells: rawCells.map(text => ({ text, isHeader })),
        });
        i++;
      }

      if (tableRows.length > 0) {
        blocks.push({ type: 'table', rows: tableRows, caption });
      }
      continue;
    }

    // Check for tab-separated table lines: 2 or more consecutive lines with >= 2 tabs
    if (line.includes('\t') && i + 1 < lines.length && lines[i + 1].includes('\t')) {
      const tableRows: TableRow[] = [];
      while (i < lines.length && lines[i].includes('\t')) {
        const rawCells = lines[i].split('\t').map(c => c.trim());
        const isHeader = tableRows.length === 0;
        tableRows.push({
          cells: rawCells.map(text => ({ text, isHeader })),
        });
        i++;
      }
      if (tableRows.length > 0) {
        blocks.push({ type: 'table', rows: tableRows });
      }
      continue;
    }

    // Check for section heading
    if (isSectionHeading(line)) {
      blocks.push({ type: 'heading', level: 2, text: line });
      i++;
      continue;
    }

    // List item
    if (/^[-*•]\s+/.test(line)) {
      blocks.push({ type: 'list_item', text: line.replace(/^[-*•]\s+/, '') });
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push({ type: 'paragraph', text: line });
    i++;
  }

  return blocks;
}

// Extract both plain text and structured blocks (with tables) from DOCX file buffer
export async function parseManuscriptDocx(buffer: Buffer): Promise<{ fullText: string; blocks: ManuscriptContentBlock[] }> {
  try {
    const htmlResult = await mammoth.convertToHtml({ buffer });
    const html = htmlResult.value || '';
    const rawResult = await mammoth.extractRawText({ buffer });
    const fullText = rawResult.value || '';
    const blocks = parseHtmlToBlocks(html);

    // If HTML blocks were empty or mammoth produced minimal tags, fall back to text parsing
    if (blocks.length === 0 && fullText.trim()) {
      return { fullText, blocks: parseTextToBlocks(fullText) };
    }

    return { fullText, blocks };
  } catch (err) {
    console.warn('Docx parsing error, fallback to raw text:', err);
    const rawText = buffer.toString('utf-8');
    return { fullText: rawText, blocks: parseTextToBlocks(rawText) };
  }
}

// Extract plain text from DOCX file buffer (kept for backwards compatibility)
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    console.warn('Docx text extraction fallback:', err);
    return buffer.toString('utf-8');
  }
}

export interface StampPdfData {
  journalTitle: string;
  journalAbbreviation: string;
  journalSlug?: string;
  journalUrl?: string;
  volumeNumber: number;
  issueNumber: number;
  year: number;
  articleNumber?: string | null;
  pageRange?: string | null;
  doi?: string | null;
  onlineIssn?: string | null;
  printIssn?: string | null;
  title?: string;
  authors?: { firstName: string; lastName: string }[];
  publishedAt?: Date | string | null;
  receivedAt?: Date | string | null;
  acceptedAt?: Date | string | null;
}

// Stamp an existing manuscript PDF (preserving full text, figures, and tables) with scholarly headers, footers, and aligned pagination
export async function stampScholarlyPdf(
  inputBuffer: Buffer,
  meta: StampPdfData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  if (meta.title) pdfDoc.setTitle(sanitizeForPdf(meta.title));
  if (meta.authors && meta.authors.length > 0) {
    pdfDoc.setAuthor(meta.authors.map(a => `${a.firstName} ${a.lastName}`).join(', '));
  }
  pdfDoc.setSubject(`Published in ${sanitizeForPdf(meta.journalTitle)}`);
  pdfDoc.setProducer('NextGen Innovation & Research Journal, London, UK');
  pdfDoc.setCreator('NextGen Scholarly Publishing Typesetter');
  if (meta.publishedAt) {
    const pDate = typeof meta.publishedAt === 'string' ? new Date(meta.publishedAt) : meta.publishedAt;
    if (!isNaN(pDate.getTime())) {
      pdfDoc.setCreationDate(pDate);
    }
  }
  pdfDoc.setModificationDate(new Date());

  // Palette
  const navyDark = rgb(11 / 255, 25 / 255, 44 / 255);
  const slateMuted = rgb(100 / 255, 116 / 255, 139 / 255);

  let startPageNum = 1;
  if (meta.pageRange) {
    const match = meta.pageRange.match(/\b(\d+)\b/);
    if (match) {
      const p = parseInt(match[1], 10);
      if (!isNaN(p) && p > 0) startPageNum = p;
    }
  }

  const pageCount = pdfDoc.getPageCount();
  const bottomY = 32;

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const marginX = 50;
    const actualPageNum = startPageNum + i;

    // 1. Cover the bottom margin with a clean white band to mask any old/stale footer
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 48,
      color: rgb(1, 1, 1),
    });

    // 2. Draw standard NextGen Footer
    page.drawLine({
      start: { x: marginX, y: bottomY + 10 },
      end: { x: width - marginX, y: bottomY + 10 },
      thickness: 0.5,
      color: rgb(226 / 255, 232 / 255, 240 / 255),
    });

    const copyrightText = `© ${meta.year} NextGen Innovation & Research Journal, London, UK. CC BY 4.0`;
    page.drawText(copyrightText, {
      x: marginX,
      y: bottomY + 1,
      size: 7,
      font: helvetica,
      color: slateMuted,
    });

    const pageStr = `${sanitizeForPdf(meta.journalAbbreviation)} • Page ${actualPageNum}`;
    const pageStrWidth = helvetica.widthOfTextAtSize(pageStr, 7);
    page.drawText(pageStr, {
      x: width - marginX - pageStrWidth,
      y: bottomY + 1,
      size: 7,
      font: helveticaBold,
      color: navyDark,
    });

    // 3. Header: on follow-on pages (i > 0), ensure running header is present
    if (i > 0) {
      const headerY = height - 32;
      page.drawRectangle({
        x: 0,
        y: height - 40,
        width: width,
        height: 40,
        color: rgb(1, 1, 1),
      });

      page.drawText(`${sanitizeForPdf(meta.journalAbbreviation)} (${meta.year})`, {
        x: marginX,
        y: headerY,
        size: 7.5,
        font: helveticaOblique,
        color: slateMuted,
      });

      const headerRight = `Vol. ${meta.volumeNumber}, No. ${meta.issueNumber} • Page ${actualPageNum}${meta.doi ? ` | DOI: ${meta.doi}` : ''}`;
      const headerRightWidth = helvetica.widthOfTextAtSize(headerRight, 7.5);
      page.drawText(headerRight, {
        x: width - marginX - headerRightWidth,
        y: headerY,
        size: 7.5,
        font: helvetica,
        color: slateMuted,
      });

      page.drawLine({
        start: { x: marginX, y: headerY - 6 },
        end: { x: width - marginX, y: headerY - 6 },
        thickness: 0.5,
        color: rgb(226 / 255, 232 / 255, 240 / 255),
      });
    }
  }

  return await pdfDoc.save();
}

export async function generateScholarlyArticlePdf(data: ScholarlyPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Set document metadata
  pdfDoc.setTitle(data.title);
  pdfDoc.setAuthor(data.authors.map(a => `${a.firstName} ${a.lastName}`).join(', '));
  pdfDoc.setSubject(`Published in ${data.journalTitle}`);
  pdfDoc.setKeywords(data.keywords || ['Open Access', 'Peer-Reviewed', 'NextGen Innovation & Research Journals']);
  pdfDoc.setProducer('NextGen Innovation & Research Journal, London, UK');
  pdfDoc.setCreator('NextGen Scholarly Publishing Typesetter');
  if (data.publishedAt) {
    const pDate = typeof data.publishedAt === 'string' ? new Date(data.publishedAt) : data.publishedAt;
    if (!isNaN(pDate.getTime())) {
      pdfDoc.setCreationDate(pDate);
    }
  }
  pdfDoc.setModificationDate(new Date());

  // Embed standard PDF fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Palette
  const navyDark = rgb(11 / 255, 25 / 255, 44 / 255);       // #0b192c
  const bluePrimary = rgb(37 / 255, 99 / 255, 235 / 255);    // #2563eb
  const goldAccent = rgb(217 / 255, 119 / 255, 6 / 255);     // #d97706
  const slateDark = rgb(30 / 255, 41 / 255, 59 / 255);       // #1e293b
  const slateMuted = rgb(100 / 255, 116 / 255, 139 / 255);  // #64748b
  const slateLight = rgb(241 / 255, 245 / 255, 249 / 255);  // #f1f5f9
  const emeraldGreen = rgb(16 / 255, 149 / 255, 106 / 255); // #10956a

  const pageWidth = 595.28; // Standard A4 points
  const pageHeight = 841.89;
  const marginX = 50;
  const contentWidth = pageWidth - marginX * 2;
  const bottomMargin = 55;

  let currentPageIndex = 0;
  const pages: PDFPage[] = [];

  // Parse starting page number from pageRange (e.g. "32-48" -> 32, "11-17" -> 11)
  let startPageNum = 1;
  if (data.pageRange) {
    const match = data.pageRange.match(/\b(\d+)\b/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        startPageNum = parsed;
      }
    }
  }

  // Helper to start a new page with appropriate running header
  function createPage(isFollowOn: boolean = false): { page: PDFPage; startY: number } {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(page);
    currentPageIndex += 1;

    // Intercept drawText to make sure no unencodable character crashes the generator
    const originalDrawText = page.drawText.bind(page);
    (page as any).drawText = (text: string, options?: any) => {
      if (!text) return page;
      const clean = sanitizeForPdf(text);
      try {
        return originalDrawText(clean, options);
      } catch (err) {
        // Fallback: strip to pure 7-bit printable ASCII
        const ascii = clean.replace(/[^\x20-\x7E]/g, ' ');
        try {
          return originalDrawText(ascii, options);
        } catch {
          return page;
        }
      }
    };

    let y = pageHeight - 45;

    if (!isFollowOn) {
      // PAGE 1: FULL SCHOLARLY MASTHEAD
      page.drawRectangle({
        x: marginX,
        y: y,
        width: contentWidth,
        height: 3,
        color: navyDark,
      });
      page.drawRectangle({
        x: marginX,
        y: y - 2,
        width: 60,
        height: 2,
        color: goldAccent,
      });

      y -= 16;
      page.drawText(data.journalTitle.toUpperCase(), {
        x: marginX,
        y,
        size: 8.5,
        font: helveticaBold,
        color: navyDark,
      });

      const headerRight = `Vol. ${data.volumeNumber}, No. ${data.issueNumber} (${data.year}) ${data.pageRange ? `• pp. ${data.pageRange}` : ''}`;
      const headerRightWidth = helvetica.widthOfTextAtSize(headerRight, 8);
      page.drawText(headerRight, {
        x: pageWidth - marginX - headerRightWidth,
        y,
        size: 8,
        font: helvetica,
        color: slateMuted,
      });

      y -= 12;
      const siteBase = getBaseUrl();
      const journalUrl = data.journalUrl || (data.journalSlug ? `${siteBase}/journals/${data.journalSlug}` : siteBase);
      page.drawText(journalUrl, {
        x: marginX,
        y,
        size: 7.5,
        font: helveticaBold,
        color: bluePrimary,
      });

      const issnParts: string[] = [];
      if (data.onlineIssn) issnParts.push(`Online ISSN: ${data.onlineIssn}`);
      if (data.printIssn) issnParts.push(`Print ISSN: ${data.printIssn}`);
      const issnDisplay = issnParts.length > 0 ? issnParts.join('  •  ') : (data.onlineIssn ? `ISSN: ${data.onlineIssn}` : 'ISSN: Pending');
      const issnWidth = helvetica.widthOfTextAtSize(issnDisplay, 7.5);
      page.drawText(issnDisplay, {
        x: pageWidth - marginX - issnWidth,
        y,
        size: 7.5,
        font: helvetica,
        color: slateMuted,
      });

      y -= 10;
      page.drawLine({
        start: { x: marginX, y },
        end: { x: pageWidth - marginX, y },
        thickness: 0.5,
        color: rgb(226 / 255, 232 / 255, 240 / 255),
      });

      return { page, startY: y - 16 };
    } else {
      // FOLLOW-ON PAGES: COMPACT RUNNING HEADER
      const firstAuthor = data.authors[0] ? `${data.authors[0].lastName} et al.` : 'NextGen Journals';
      page.drawText(`${firstAuthor} • ${data.journalAbbreviation} (${data.year})`, {
        x: marginX,
        y,
        size: 7.5,
        font: helveticaOblique,
        color: slateMuted,
      });

      const followPageNum = startPageNum + (currentPageIndex - 1);
      const headerRightFollow = `Vol. ${data.volumeNumber}, No. ${data.issueNumber} • Page ${followPageNum}${data.doi ? ` | DOI: ${data.doi}` : ''}`;
      const headerRightWidth = helvetica.widthOfTextAtSize(headerRightFollow, 7.5);
      page.drawText(headerRightFollow, {
        x: pageWidth - marginX - headerRightWidth,
        y,
        size: 7.5,
        font: helvetica,
        color: slateMuted,
      });

      y -= 8;
      page.drawLine({
        start: { x: marginX, y },
        end: { x: pageWidth - marginX, y },
        thickness: 0.5,
        color: rgb(226 / 255, 232 / 255, 240 / 255),
      });

      return { page, startY: y - 18 };
    }
  }

  // Helper to add bottom footer to a page
  function renderFooter(page: PDFPage, pageNum: number) {
    const bottomY = 36;
    page.drawLine({
      start: { x: marginX, y: bottomY + 12 },
      end: { x: pageWidth - marginX, y: bottomY + 12 },
      thickness: 0.5,
      color: rgb(226 / 255, 232 / 255, 240 / 255),
    });

    const copyrightText = `© ${data.year} NextGen Innovation & Research Journal, London, UK. CC BY 4.0`;
    page.drawText(copyrightText, {
      x: marginX,
      y: bottomY + 2,
      size: 7,
      font: helvetica,
      color: slateMuted,
    });

    const actualPageNum = startPageNum + (pageNum - 1);
    const pageStr = `${data.journalAbbreviation} • Page ${actualPageNum}`;
    const pageStrWidth = helvetica.widthOfTextAtSize(pageStr, 7);
    page.drawText(pageStr, {
      x: pageWidth - marginX - pageStrWidth,
      y: bottomY + 2,
      size: 7,
      font: helveticaBold,
      color: navyDark,
    });
  }

  // ===================== PAGE 1 INITIALIZATION =====================
  let { page: activePage, startY: currentY } = createPage(false);

  // 1. Article Type & Open Access badge
  const articleTypeLabel = (data.articleType || 'RESEARCH_ARTICLE').replace(/_/g, ' ').toUpperCase();
  activePage.drawText(articleTypeLabel, {
    x: marginX,
    y: currentY,
    size: 8.5,
    font: helveticaBold,
    color: bluePrimary,
  });

  const oaBadgeText = 'OPEN ACCESS • CC BY 4.0';
  const oaBadgeWidth = helveticaBold.widthOfTextAtSize(oaBadgeText, 7.5);
  activePage.drawRectangle({
    x: pageWidth - marginX - oaBadgeWidth - 10,
    y: currentY - 2,
    width: oaBadgeWidth + 10,
    height: 12,
    color: rgb(236 / 255, 253 / 255, 245 / 255),
  });
  activePage.drawText(oaBadgeText, {
    x: pageWidth - marginX - oaBadgeWidth - 5,
    y: currentY,
    size: 7.5,
    font: helveticaBold,
    color: emeraldGreen,
  });

  // 2. Title
  currentY -= 22;
  const titleLines = wrapText(data.title, contentWidth, timesBold, 15);
  for (const line of titleLines) {
    activePage.drawText(line, {
      x: marginX,
      y: currentY,
      size: 15,
      font: timesBold,
      color: navyDark,
    });
    currentY -= 19;
  }

  // 3. Authors
  currentY -= 4;
  const authorNamesWithSup = data.authors.map((a, idx) => {
    const star = a.isCorresponding ? '*' : '';
    return `${a.firstName} ${a.lastName}${star} [${idx + 1}]`;
  }).join('   ');

  const authorLines = wrapText(authorNamesWithSup, contentWidth, helveticaBold, 9.5);
  for (const line of authorLines) {
    activePage.drawText(line, {
      x: marginX,
      y: currentY,
      size: 9.5,
      font: helveticaBold,
      color: slateDark,
    });
    currentY -= 13;
  }

  // 4. Affiliations
  currentY -= 3;
  data.authors.forEach((author, idx) => {
    const affilText = `[${idx + 1}] ${author.affiliation || 'Department of Scientific Research'}`;
    const affilLines = wrapText(affilText, contentWidth, helvetica, 8);
    for (const line of affilLines) {
      activePage.drawText(line, {
        x: marginX,
        y: currentY,
        size: 8,
        font: helvetica,
        color: slateMuted,
      });
      currentY -= 11;
    }
  });

  // Corresponding author footnote
  const corrAuthor = data.authors.find(a => a.isCorresponding) || data.authors[0];
  if (corrAuthor) {
    const corrText = `* Corresponding Author: ${corrAuthor.firstName} ${corrAuthor.lastName} (${corrAuthor.email || 'nextgenjournals@gmail.com'})`;
    activePage.drawText(corrText, {
      x: marginX,
      y: currentY,
      size: 7.5,
      font: helveticaOblique,
      color: slateMuted,
    });
    currentY -= 15;
  } else {
    currentY -= 6;
  }

  // 4b. Scholarly Publication Information Bar (Google Scholar Indexing Requirement)
  const formatScholarlyDate = (d?: Date | string | null): string | null => {
    if (!d) return null;
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const pubDateFormatted = formatScholarlyDate(data.publishedAt) || `${data.year}`;
  const pubDateLine = `Published Online: ${pubDateFormatted}`;

  currentY -= 2;
  activePage.drawLine({
    start: { x: marginX, y: currentY },
    end: { x: pageWidth - marginX, y: currentY },
    thickness: 0.5,
    color: rgb(203 / 255, 213 / 255, 225 / 255),
  });
  currentY -= 9;

  activePage.drawText(pubDateLine, {
    x: marginX,
    y: currentY,
    size: 7.5,
    font: helveticaBold,
    color: navyDark,
  });

  if (data.doi) {
    const rawDoi = data.doi.replace(/^https?:\/\/doi\.org\//, '');
    const doiLine = `DOI: https://doi.org/${rawDoi}`;
    const doiWidth = helvetica.widthOfTextAtSize(doiLine, 7.5);
    activePage.drawText(doiLine, {
      x: pageWidth - marginX - doiWidth,
      y: currentY,
      size: 7.5,
      font: helvetica,
      color: bluePrimary,
    });
  }

  currentY -= 5;
  activePage.drawLine({
    start: { x: marginX, y: currentY },
    end: { x: pageWidth - marginX, y: currentY },
    thickness: 0.5,
    color: rgb(203 / 255, 213 / 255, 225 / 255),
  });
  currentY -= 14;

  // 5. Abstract
  activePage.drawText('ABSTRACT', {
    x: marginX,
    y: currentY,
    size: 9.5,
    font: helveticaBold,
    color: navyDark,
  });
  currentY -= 14;

  const abstractLines = wrapText(data.abstract, contentWidth, timesRoman, 9.5);
  for (const line of abstractLines) {
    if (currentY < bottomMargin + 40) {
      const next = createPage(true);
      activePage = next.page;
      currentY = next.startY;
    }
    activePage.drawText(line, {
      x: marginX,
      y: currentY,
      size: 9.5,
      font: timesRoman,
      color: slateDark,
    });
    currentY -= 13;
  }

  // 7. Keywords
  currentY -= 6;
  if (data.keywords && data.keywords.length > 0) {
    const kwText = `Keywords: ${data.keywords.join(', ')}`;
    const kwLines = wrapText(kwText, contentWidth, timesItalic, 9);
    for (const line of kwLines) {
      if (currentY < bottomMargin + 30) {
        const next = createPage(true);
        activePage = next.page;
        currentY = next.startY;
      }
      activePage.drawText(line, {
        x: marginX,
        y: currentY,
        size: 9,
        font: timesItalic,
        color: slateDark,
      });
      currentY -= 12;
    }
  }

  // 8. Citation box
  currentY -= 10;
  if (data.citationString) {
    activePage.drawRectangle({
      x: marginX,
      y: currentY - 26,
      width: contentWidth,
      height: 34,
      color: rgb(248 / 255, 250 / 255, 252 / 255),
      borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
      borderWidth: 0.5,
    });

    activePage.drawText('HOW TO CITE THIS ARTICLE:', {
      x: marginX + 8,
      y: currentY - 2,
      size: 7,
      font: helveticaBold,
      color: navyDark,
    });

    const citeLines = wrapText(data.citationString, contentWidth - 16, helvetica, 7.5);
    let citeY = currentY - 12;
    for (const cLine of citeLines.slice(0, 2)) {
      activePage.drawText(cLine, {
        x: marginX + 8,
        y: citeY,
        size: 7.5,
        font: helvetica,
        color: slateMuted,
      });
      citeY -= 9;
    }
    currentY -= 40;
  }

  // ===================== FULL MANUSCRIPT TEXT & TABLES =====================
  // Resolve structured manuscript blocks (either provided directly or parsed from text)
  let blocksToRender: ManuscriptContentBlock[] = [];

  if (data.manuscriptBlocks && data.manuscriptBlocks.length > 0) {
    blocksToRender = data.manuscriptBlocks;
  } else if (data.manuscriptFullText && data.manuscriptFullText.trim().length > 30) {
    blocksToRender = parseTextToBlocks(data.manuscriptFullText);
  }

  if (blocksToRender.length > 0) {
    currentY -= 8;

    for (const block of blocksToRender) {
      if (block.type === 'heading') {
        currentY -= 12;
        if (currentY < bottomMargin + 60) {
          const next = createPage(true);
          activePage = next.page;
          currentY = next.startY;
        }

        activePage.drawText(block.text.toUpperCase(), {
          x: marginX,
          y: currentY,
          size: block.level === 1 ? 10.5 : 9.5,
          font: helveticaBold,
          color: navyDark,
        });

        currentY -= 14;
      } else if (block.type === 'table') {
        if (!block.rows || block.rows.length === 0) continue;

        const numCols = Math.max(...block.rows.map(r => r.cells.length));
        if (numCols === 0) continue;

        // Calculate column widths proportional to content with reasonable boundaries
        const rawColLengths: number[] = new Array(numCols).fill(0);
        block.rows.forEach(r => {
          r.cells.forEach((c, idx) => {
            rawColLengths[idx] = Math.max(rawColLengths[idx], (c.text || '').length);
          });
        });

        const totalLength = rawColLengths.reduce((a, b) => a + b, 0) || 1;
        const minColWidth = Math.max(30, Math.min(65, (contentWidth / numCols) * 0.55));
        const remainingWidth = Math.max(0, contentWidth - minColWidth * numCols);

        let colWidths: number[] = rawColLengths.map(len => {
          return minColWidth + (len / totalLength) * remainingWidth;
        });

        // Normalize sum to match contentWidth exactly
        const currentSum = colWidths.reduce((a, b) => a + b, 0);
        if (currentSum > 0 && Math.abs(currentSum - contentWidth) > 0.5) {
          const ratio = contentWidth / currentSum;
          colWidths = colWidths.map(w => w * ratio);
        }

        currentY -= 8;

        // Render table caption if available
        if (block.caption) {
          if (currentY < bottomMargin + 40) {
            const next = createPage(true);
            activePage = next.page;
            currentY = next.startY;
          }
          activePage.drawText(block.caption, {
            x: marginX,
            y: currentY,
            size: 8.5,
            font: helveticaBold,
            color: navyDark,
          });
          currentY -= 12;
        }

        // Top table rule (scholarly heavy rule)
        if (currentY < bottomMargin + 40) {
          const next = createPage(true);
          activePage = next.page;
          currentY = next.startY;
        }

        activePage.drawLine({
          start: { x: marginX, y: currentY },
          end: { x: marginX + contentWidth, y: currentY },
          thickness: 1.2,
          color: navyDark,
        });
        currentY -= 2;

        // Render each row of table
        block.rows.forEach((row, rowIndex) => {
          const isFirstRow = rowIndex === 0;
          const isHeaderRow = isFirstRow || row.cells.some(c => c.isHeader);
          const cellFont = isHeaderRow ? helveticaBold : timesRoman;
          const cellFontSize = 7.5;
          const cellTextColor = isHeaderRow ? navyDark : slateDark;

          const cellLines = row.cells.map((cell, colIdx) => {
            const width = colWidths[colIdx] || (contentWidth / numCols);
            return wrapText(cell.text || '', width - 8, cellFont, cellFontSize);
          });

          const maxLines = Math.max(1, ...cellLines.map(l => l.length));
          const rowHeight = maxLines * 10 + 8;

          // Check for page break
          if (currentY - rowHeight < bottomMargin + 20) {
            activePage.drawLine({
              start: { x: marginX, y: currentY + 2 },
              end: { x: marginX + contentWidth, y: currentY + 2 },
              thickness: 0.5,
              color: slateMuted,
            });

            const next = createPage(true);
            activePage = next.page;
            currentY = next.startY;

            activePage.drawLine({
              start: { x: marginX, y: currentY },
              end: { x: marginX + contentWidth, y: currentY },
              thickness: 1.2,
              color: navyDark,
            });
            currentY -= 2;
          }

          // Header background fill or subtle zebra striping for alternate rows
          if (isHeaderRow) {
            activePage.drawRectangle({
              x: marginX,
              y: currentY - rowHeight + 2,
              width: contentWidth,
              height: rowHeight,
              color: rgb(241 / 255, 245 / 255, 249 / 255),
            });
          } else if (rowIndex % 2 === 1) {
            activePage.drawRectangle({
              x: marginX,
              y: currentY - rowHeight + 2,
              width: contentWidth,
              height: rowHeight,
              color: rgb(250 / 255, 250 / 255, 252 / 255),
            });
          }

          // Draw subtle vertical column boundaries
          let vLineX = marginX;
          for (let c = 0; c < numCols - 1; c++) {
            vLineX += colWidths[c];
            activePage.drawLine({
              start: { x: vLineX, y: currentY + 2 },
              end: { x: vLineX, y: currentY - rowHeight + 2 },
              thickness: 0.35,
              color: rgb(226 / 255, 232 / 255, 240 / 255),
            });
          }

          // Draw cell texts
          let cellStartX = marginX;
          row.cells.forEach((cell, colIdx) => {
            const width = colWidths[colIdx] || (contentWidth / numCols);
            let textY = currentY - 9;
            const lines = cellLines[colIdx] || [];
            for (const line of lines) {
              activePage.drawText(line, {
                x: cellStartX + 4,
                y: textY,
                size: cellFontSize,
                font: cellFont,
                color: cellTextColor,
              });
              textY -= 10;
            }
            cellStartX += width;
          });

          currentY -= rowHeight;

          // Header bottom rule vs data divider
          if (isHeaderRow) {
            activePage.drawLine({
              start: { x: marginX, y: currentY + 2 },
              end: { x: marginX + contentWidth, y: currentY + 2 },
              thickness: 0.8,
              color: navyDark,
            });
          } else {
            activePage.drawLine({
              start: { x: marginX, y: currentY + 2 },
              end: { x: marginX + contentWidth, y: currentY + 2 },
              thickness: 0.4,
              color: rgb(226 / 255, 232 / 255, 240 / 255),
            });
          }
        });

        // Bottom Table Rule
        activePage.drawLine({
          start: { x: marginX, y: currentY + 2 },
          end: { x: marginX + contentWidth, y: currentY + 2 },
          thickness: 1.2,
          color: navyDark,
        });

        currentY -= 12;
      } else if (block.type === 'list_item') {
        const itemLines = wrapText(block.text, contentWidth - 14, timesRoman, 9.5);
        let firstLine = true;
        for (const line of itemLines) {
          if (currentY < bottomMargin + 20) {
            const next = createPage(true);
            activePage = next.page;
            currentY = next.startY;
          }
          if (firstLine) {
            activePage.drawText('-', {
              x: marginX + 4,
              y: currentY,
              size: 9.5,
              font: helveticaBold,
              color: bluePrimary,
            });
            firstLine = false;
          }
          activePage.drawText(line, {
            x: marginX + 14,
            y: currentY,
            size: 9.5,
            font: timesRoman,
            color: slateDark,
          });
          currentY -= 13;
        }
        currentY -= 3;
      } else {
        // Regular paragraph
        const pLines = wrapText(block.text, contentWidth, timesRoman, 9.5);
        for (const line of pLines) {
          if (currentY < bottomMargin + 20) {
            const next = createPage(true);
            activePage = next.page;
            currentY = next.startY;
          }
          activePage.drawText(line, {
            x: marginX,
            y: currentY,
            size: 9.5,
            font: timesRoman,
            color: slateDark,
          });
          currentY -= 13;
        }
        currentY -= 6; // Paragraph spacing
      }
    }
  }

  // ===================== STATEMENTS & DECLARATIONS =====================
  if (data.declarations && data.declarations.length > 0) {
    const validStatements = data.declarations.filter(s => s.text && s.text.trim().length > 0);
    if (validStatements.length > 0) {
      currentY -= 12;
      if (currentY < bottomMargin + 60) {
        const next = createPage(true);
        activePage = next.page;
        currentY = next.startY;
      }

      activePage.drawText('STATEMENTS & DECLARATIONS', {
        x: marginX,
        y: currentY,
        size: 10,
        font: helveticaBold,
        color: navyDark,
      });
      currentY -= 14;

      for (const stmt of validStatements) {
        if (currentY < bottomMargin + 40) {
          const next = createPage(true);
          activePage = next.page;
          currentY = next.startY;
        }

        activePage.drawText(`${stmt.label}:`, {
          x: marginX,
          y: currentY,
          size: 8.5,
          font: helveticaBold,
          color: slateDark,
        });
        currentY -= 12;

        const stmtLines = wrapText(stmt.text!, contentWidth, timesRoman, 8.5);
        for (const line of stmtLines) {
          if (currentY < bottomMargin + 20) {
            const next = createPage(true);
            activePage = next.page;
            currentY = next.startY;
          }
          activePage.drawText(line, {
            x: marginX,
            y: currentY,
            size: 8.5,
            font: timesRoman,
            color: slateDark,
          });
          currentY -= 11;
        }
        currentY -= 6;
      }
    }
  }

  // ===================== REFERENCES SECTION =====================
  if (data.references && data.references.length > 0) {
    currentY -= 12;
    if (currentY < bottomMargin + 60) {
      const next = createPage(true);
      activePage = next.page;
      currentY = next.startY;
    }

    activePage.drawText('REFERENCES', {
      x: marginX,
      y: currentY,
      size: 10,
      font: helveticaBold,
      color: navyDark,
    });
    currentY -= 14;

    data.references.forEach((ref, idx) => {
      const refNumber = `[${ref.orderIndex || idx + 1}] `;
      const refFull = `${refNumber}${ref.rawText}${ref.doi ? ` https://doi.org/${ref.doi}` : ''}`;
      const refLines = wrapText(refFull, contentWidth, timesRoman, 8);

      for (const line of refLines) {
        if (currentY < bottomMargin + 20) {
          const next = createPage(true);
          activePage = next.page;
          currentY = next.startY;
        }
        activePage.drawText(line, {
          x: marginX,
          y: currentY,
          size: 8,
          font: timesRoman,
          color: slateDark,
        });
        currentY -= 10.5;
      }
      currentY -= 3;
    });
  }

  // Render footers across all generated pages
  pages.forEach((p, index) => {
    renderFooter(p, index + 1);
  });

  return await pdfDoc.save();
}
