export interface CitationArticleData {
  title: string;
  journalTitle: string;
  volumeNumber?: number;
  issueNumber?: number;
  year: number;
  pages?: string;
  doi?: string | null;
  authors: { firstName: string; lastName: string }[];
  url?: string;
}

export function generateBibTeX(data: CitationArticleData): string {
  const firstAuthorLast = data.authors[0]?.lastName.toLowerCase().replace(/[^a-z]/g, '') || 'author';
  const citeKey = `${firstAuthorLast}${data.year}${data.title.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}`;
  const authorString = data.authors.map(a => `${a.lastName}, ${a.firstName}`).join(' and ');

  return `@article{${citeKey},
  author    = {${authorString}},
  title     = {{${data.title}}},
  journal   = {${data.journalTitle}},
  year      = {${data.year}}${data.volumeNumber ? `,\n  volume    = {${data.volumeNumber}}` : ''}${data.issueNumber ? `,\n  number    = {${data.issueNumber}}` : ''}${data.pages ? `,\n  pages     = {${data.pages}}` : ''}${data.doi ? `,\n  doi       = {${data.doi}}` : ''}${data.url ? `,\n  url       = {${data.url}}` : ''}
}`;
}

export function generateRIS(data: CitationArticleData): string {
  const lines: string[] = [
    'TY  - JOUR',
    `TI  - ${data.title}`,
    `JO  - ${data.journalTitle}`,
    `PY  - ${data.year}`,
  ];

  data.authors.forEach(author => {
    lines.push(`AU  - ${author.lastName}, ${author.firstName}`);
  });

  if (data.volumeNumber) lines.push(`VL  - ${data.volumeNumber}`);
  if (data.issueNumber) lines.push(`IS  - ${data.issueNumber}`);
  if (data.pages) {
    const [sp, ep] = data.pages.split('-');
    if (sp) lines.push(`SP  - ${sp.trim()}`);
    if (ep) lines.push(`EP  - ${ep.trim()}`);
  }
  if (data.doi) lines.push(`DO  - ${data.doi}`);
  if (data.url) lines.push(`UR  - ${data.url}`);

  lines.push('ER  - ');
  return lines.join('\r\n');
}

export function generateAPACitation(data: CitationArticleData): string {
  const authorNames = data.authors.map((a, i) => {
    const initial = a.firstName ? `${a.firstName.charAt(0)}.` : '';
    return `${a.lastName}, ${initial}`;
  });

  let authorPart = '';
  if (authorNames.length === 1) {
    authorPart = authorNames[0];
  } else if (authorNames.length === 2) {
    authorPart = `${authorNames[0]} & ${authorNames[1]}`;
  } else {
    authorPart = `${authorNames.slice(0, -1).join(', ')}, & ${authorNames[authorNames.length - 1]}`;
  }

  const volIssue = [
    data.volumeNumber ? `${data.volumeNumber}` : '',
    data.issueNumber ? `(${data.issueNumber})` : '',
    data.pages ? `, ${data.pages}` : '',
  ].join('');

  const doiPart = data.doi ? ` https://doi.org/${data.doi}` : '';

  return `${authorPart} (${data.year}). ${data.title}. ${data.journalTitle}${volIssue ? `, ${volIssue}` : ''}.${doiPart}`;
}
