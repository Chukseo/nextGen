import { describe, it, expect } from 'vitest';
import { generateBibTeX, generateRIS, generateAPACitation } from '../src/lib/citations';

describe('Academic Citation Generation Subsystem', () => {
  const sampleArticle = {
    title: 'Neural Foundations of High-Dimensional Optimization in Heterogeneous Compute Clusters',
    journalTitle: 'Journal of Science, Technology & AI',
    volumeNumber: 1,
    issueNumber: 1,
    year: 2026,
    pages: '1-16',
    doi: '10.5555/jstai.2026.001',
    url: 'http://localhost:3000/articles/art-1',
    authors: [
      { firstName: 'David', lastName: 'Lewis' },
      { firstName: 'Kavita', lastName: 'Raman' },
    ],
  };

  it('generates compliant APA 7th edition citation string', () => {
    const apa = generateAPACitation(sampleArticle);
    expect(apa).toContain('Lewis, D. & Raman, K. (2026).');
    expect(apa).toContain('Journal of Science, Technology & AI, 1(1), 1-16.');
    expect(apa).toContain('https://doi.org/10.5555/jstai.2026.001');
  });

  it('generates standard BibTeX formatted entry', () => {
    const bibtex = generateBibTeX(sampleArticle);
    expect(bibtex).toContain('@article{');
    expect(bibtex).toContain('author    = {Lewis, David and Raman, Kavita}');
    expect(bibtex).toContain('title     = {{Neural Foundations of High-Dimensional Optimization in Heterogeneous Compute Clusters}}');
    expect(bibtex).toContain('journal   = {Journal of Science, Technology & AI}');
    expect(bibtex).toContain('year      = {2026}');
    expect(bibtex).toContain('volume    = {1}');
    expect(bibtex).toContain('number    = {1}');
    expect(bibtex).toContain('doi       = {10.5555/jstai.2026.001}');
  });

  it('generates valid RIS citation format for reference managers (Zotero, EndNote)', () => {
    const ris = generateRIS(sampleArticle);
    expect(ris).toContain('TY  - JOUR');
    expect(ris).toContain('TI  - Neural Foundations of High-Dimensional Optimization in Heterogeneous Compute Clusters');
    expect(ris).toContain('AU  - Lewis, David');
    expect(ris).toContain('AU  - Raman, Kavita');
    expect(ris).toContain('JO  - Journal of Science, Technology & AI');
    expect(ris).toContain('VL  - 1');
    expect(ris).toContain('IS  - 1');
    expect(ris).toContain('SP  - 1');
    expect(ris).toContain('EP  - 16');
    expect(ris).toContain('DO  - 10.5555/jstai.2026.001');
    expect(ris).toContain('ER  - ');
  });
});
