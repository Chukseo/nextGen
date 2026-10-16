import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import mammoth from 'mammoth';

export interface ScholarlyPdfData {
  journalTitle: string;
  journalAbbreviation: string;
  onlineIssn?: string | null;
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

// Utility to wrap text into lines fitting a maxWidth
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
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

// Extract plain text from DOCX file buffer
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    console.warn('Docx text extraction fallback:', err);
    return buffer.toString('utf-8');
  }
}

export async function generateScholarlyArticlePdf(data: ScholarlyPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Set document metadata
  pdfDoc.setTitle(data.title);
  pdfDoc.setAuthor(data.authors.map(a => `${a.firstName} ${a.lastName}`).join(', '));
  pdfDoc.setSubject(`Published in ${data.journalTitle}`);
  pdfDoc.setKeywords(data.keywords || ['Open Access', 'Peer-Reviewed', 'NextGen Press']);
  pdfDoc.setProducer('NextGen Research and Innovation Press (Lagos, Nigeria)');
  pdfDoc.setCreator('NextGen Scholarly Publishing Typesetter');

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

  // Helper to start a new page with appropriate running header
  function createPage(isFollowOn: boolean = false): { page: PDFPage; startY: number } {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(page);
    currentPageIndex += 1;

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
      const doiText = data.doi ? `https://doi.org/${data.doi}` : 'https://nextgen-press.org';
      page.drawText(doiText, {
        x: marginX,
        y,
        size: 7.5,
        font: helveticaOblique,
        color: bluePrimary,
      });

      if (data.onlineIssn) {
        const issnText = `e-ISSN: ${data.onlineIssn}`;
        const issnWidth = helvetica.widthOfTextAtSize(issnText, 7.5);
        page.drawText(issnText, {
          x: pageWidth - marginX - issnWidth,
          y,
          size: 7.5,
          font: helvetica,
          color: slateMuted,
        });
      }

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
      const firstAuthor = data.authors[0] ? `${data.authors[0].lastName} et al.` : 'NextGen Press';
      page.drawText(`${firstAuthor} • ${data.journalAbbreviation} (${data.year})`, {
        x: marginX,
        y,
        size: 7.5,
        font: helveticaOblique,
        color: slateMuted,
      });

      const headerRightFollow = `Vol. ${data.volumeNumber}, No. ${data.issueNumber} | DOI: ${data.doi || ''}`;
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

    const copyrightText = `© ${data.year} NextGen Research and Innovation Press • Lagos, Nigeria. CC BY 4.0`;
    page.drawText(copyrightText, {
      x: marginX,
      y: bottomY + 2,
      size: 7,
      font: helvetica,
      color: slateMuted,
    });

    const pageStr = `${data.journalAbbreviation} • Page ${pageNum}`;
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
    const corrText = `* Corresponding Author: ${corrAuthor.firstName} ${corrAuthor.lastName} (${corrAuthor.email || 'editorial@nextgen-press.org'})`;
    activePage.drawText(corrText, {
      x: marginX,
      y: currentY,
      size: 7.5,
      font: helveticaOblique,
      color: slateMuted,
    });
    currentY -= 13;
  }

  // 5. Editorial Timeline box
  currentY -= 3;
  const boxHeight = 20;
  activePage.drawRectangle({
    x: marginX,
    y: currentY - boxHeight + 6,
    width: contentWidth,
    height: boxHeight,
    color: slateLight,
  });

  const pubDateStr = new Date(data.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const metaText = `Received: ${data.receivedAt ? new Date(data.receivedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}   |   Accepted: ${data.acceptedAt ? new Date(data.acceptedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}   |   Published Online: ${pubDateStr}`;
  activePage.drawText(metaText, {
    x: marginX + 10,
    y: currentY - 5,
    size: 7.5,
    font: helvetica,
    color: slateDark,
  });

  currentY -= (boxHeight + 14);

  // 6. Abstract
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

  // ===================== FULL MANUSCRIPT TEXT =====================
  // Process raw manuscript text if provided
  let bodyParagraphs: string[] = [];

  if (data.manuscriptFullText && data.manuscriptFullText.trim().length > 50) {
    // Split on double newlines or single newlines with non-empty text
    bodyParagraphs = data.manuscriptFullText
      .split(/\r?\n\r?\n|\r?\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  if (bodyParagraphs.length > 0) {
    currentY -= 8;

    for (const paragraph of bodyParagraphs) {
      const isHeading = isSectionHeading(paragraph);

      if (isHeading) {
        currentY -= 10;
        // Avoid orphaned heading at bottom of page
        if (currentY < bottomMargin + 60) {
          const next = createPage(true);
          activePage = next.page;
          currentY = next.startY;
        }

        activePage.drawText(paragraph.toUpperCase(), {
          x: marginX,
          y: currentY,
          size: 10,
          font: helveticaBold,
          color: navyDark,
        });

        currentY -= 14;
      } else {
        const pLines = wrapText(paragraph, contentWidth, timesRoman, 9.5);
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
        currentY -= 5; // Paragraph spacing
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
