import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

export async function generateScholarlyArticlePdf(data: ScholarlyPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Set metadata
  pdfDoc.setTitle(data.title);
  pdfDoc.setAuthor(data.authors.map(a => `${a.firstName} ${a.lastName}`).join(', '));
  pdfDoc.setSubject(`Published in ${data.journalTitle}`);
  pdfDoc.setKeywords(data.keywords || ['Open Access', 'Peer-Reviewed', 'NextGen Press']);
  pdfDoc.setProducer('NextGen Research and Innovation Press (Lagos, Nigeria)');
  pdfDoc.setCreator('NextGen Scholarly Publishing Infrastructure');

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Colors
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

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 45;

  // 1. TOP RUNNING HEADER & ACCENT BAR
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
  const doiText = `https://doi.org/${data.doi}`;
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

  // 2. ARTICLE TYPE & OPEN ACCESS BADGE
  y -= 22;
  const articleTypeLabel = (data.articleType || 'RESEARCH_ARTICLE').replace(/_/g, ' ').toUpperCase();
  page.drawText(articleTypeLabel, {
    x: marginX,
    y,
    size: 8.5,
    font: helveticaBold,
    color: bluePrimary,
  });

  const oaBadgeText = 'OPEN ACCESS • CC BY 4.0';
  const oaBadgeWidth = helveticaBold.widthOfTextAtSize(oaBadgeText, 7.5);
  page.drawRectangle({
    x: pageWidth - marginX - oaBadgeWidth - 10,
    y: y - 2,
    width: oaBadgeWidth + 10,
    height: 12,
    color: rgb(236 / 255, 253 / 255, 245 / 255),
  });
  page.drawText(oaBadgeText, {
    x: pageWidth - marginX - oaBadgeWidth - 5,
    y,
    size: 7.5,
    font: helveticaBold,
    color: emeraldGreen,
  });

  // 3. ARTICLE TITLE
  y -= 20;
  const titleLines = wrapText(data.title, contentWidth, timesBold, 16);
  for (const line of titleLines) {
    page.drawText(line, {
      x: marginX,
      y,
      size: 16,
      font: timesBold,
      color: navyDark,
    });
    y -= 20;
  }

  // 4. AUTHORS LIST
  y -= 6;
  const authorNamesWithSup = data.authors.map((a, idx) => {
    const star = a.isCorresponding ? '*' : '';
    return `${a.firstName} ${a.lastName}${star} [${idx + 1}]`;
  }).join('   ');
  
  const authorLines = wrapText(authorNamesWithSup, contentWidth, helveticaBold, 10);
  for (const line of authorLines) {
    page.drawText(line, {
      x: marginX,
      y,
      size: 10,
      font: helveticaBold,
      color: slateDark,
    });
    y -= 14;
  }

  // 5. AFFILIATIONS
  y -= 4;
  data.authors.forEach((author, idx) => {
    const affilText = `[${idx + 1}] ${author.affiliation || 'Department of Research'}`;
    const affilLines = wrapText(affilText, contentWidth, helvetica, 8);
    for (const line of affilLines) {
      page.drawText(line, {
        x: marginX,
        y,
        size: 8,
        font: helvetica,
        color: slateMuted,
      });
      y -= 11;
    }
  });

  // Corresponding author footnote
  const corrAuthor = data.authors.find(a => a.isCorresponding) || data.authors[0];
  if (corrAuthor) {
    const corrText = `* Corresponding Author: ${corrAuthor.firstName} ${corrAuthor.lastName} (${corrAuthor.email || 'editorial@nextgen-press.org'})`;
    page.drawText(corrText, {
      x: marginX,
      y,
      size: 7.5,
      font: helveticaOblique,
      color: slateMuted,
    });
    y -= 14;
  }

  // 6. EDITORIAL TIMELINE / METADATA BOX
  y -= 4;
  const boxHeight = 22;
  page.drawRectangle({
    x: marginX,
    y: y - boxHeight + 8,
    width: contentWidth,
    height: boxHeight,
    color: slateLight,
  });

  const pubDateStr = new Date(data.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const metaText = `Received: ${data.receivedAt ? new Date(data.receivedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}   |   Accepted: ${data.acceptedAt ? new Date(data.acceptedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}   |   Published Online: ${pubDateStr}`;
  page.drawText(metaText, {
    x: marginX + 12,
    y: y - 4,
    size: 7.5,
    font: helvetica,
    color: slateDark,
  });

  y -= (boxHeight + 12);

  // 7. ABSTRACT SECTION
  page.drawText('ABSTRACT', {
    x: marginX,
    y,
    size: 9.5,
    font: helveticaBold,
    color: navyDark,
  });
  y -= 14;

  const abstractLines = wrapText(data.abstract, contentWidth, timesRoman, 9.5);
  for (const line of abstractLines) {
    if (y < 120) {
      // Start a new page if space runs out
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    page.drawText(line, {
      x: marginX,
      y,
      size: 9.5,
      font: timesRoman,
      color: slateDark,
    });
    y -= 13;
  }

  // 8. KEYWORDS
  y -= 8;
  if (data.keywords && data.keywords.length > 0) {
    const kwText = `Keywords: ${data.keywords.join(', ')}`;
    const kwLines = wrapText(kwText, contentWidth, timesItalic, 9);
    for (const line of kwLines) {
      page.drawText(line, {
        x: marginX,
        y,
        size: 9,
        font: timesItalic,
        color: slateDark,
      });
      y -= 12;
    }
  }

  // 9. HOW TO CITE THIS ARTICLE BOX
  y -= 12;
  if (data.citationString) {
    page.drawRectangle({
      x: marginX,
      y: y - 28,
      width: contentWidth,
      height: 38,
      color: rgb(248 / 255, 250 / 255, 252 / 255),
      borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
      borderWidth: 0.5,
    });

    page.drawText('HOW TO CITE THIS ARTICLE:', {
      x: marginX + 8,
      y: y - 2,
      size: 7,
      font: helveticaBold,
      color: navyDark,
    });

    const citeLines = wrapText(data.citationString, contentWidth - 16, helvetica, 7.5);
    let citeY = y - 12;
    for (const cLine of citeLines.slice(0, 2)) {
      page.drawText(cLine, {
        x: marginX + 8,
        y: citeY,
        size: 7.5,
        font: helvetica,
        color: slateMuted,
      });
      citeY -= 9;
    }
    y -= 44;
  }

  // 10. EDITORIAL FOOTER & WATERMARK (Bottom of page)
  const bottomY = 40;
  page.drawLine({
    start: { x: marginX, y: bottomY + 14 },
    end: { x: pageWidth - marginX, y: bottomY + 14 },
    thickness: 0.5,
    color: rgb(203 / 255, 213 / 255, 225 / 255),
  });

  const copyrightText = `© ${data.year} NextGen Research and Innovation Press • Lagos, Nigeria. CC BY 4.0 International.`;
  page.drawText(copyrightText, {
    x: marginX,
    y: bottomY + 4,
    size: 7.5,
    font: helvetica,
    color: slateMuted,
  });

  const colophonRight = `${data.journalAbbreviation} • Crossref Registered DOI`;
  const colophonWidth = helveticaBold.widthOfTextAtSize(colophonRight, 7.5);
  page.drawText(colophonRight, {
    x: pageWidth - marginX - colophonWidth,
    y: bottomY + 4,
    size: 7.5,
    font: helveticaBold,
    color: navyDark,
  });

  return await pdfDoc.save();
}
