import { describe, it, expect } from 'vitest';
import { generateCrossrefXML, formatDOISuffix, CrossrefMetadataPayload } from '../src/lib/crossref';

describe('Crossref DOI Subsystem and Metadata Generator', () => {
  it('formats standardized journal DOI suffixes', () => {
    const suffix = formatDOISuffix('jstai', 2026, 1);
    expect(suffix).toBe('jstai.2026.001');

    const suffix2 = formatDOISuffix('necr', 2026, '042');
    expect(suffix2).toBe('necr.2026.042');
  });

  it('generates schema-compliant Crossref 5.3.1 XML batch deposit', () => {
    const payload: CrossrefMetadataPayload = {
      journalTitle: 'Journal of Science, Technology & AI',
      journalAbbr: 'J. Sci. Technol. AI',
      printIssn: '2834-9102',
      onlineIssn: '2834-9110',
      volumeNumber: 1,
      issueNumber: 1,
      publicationYear: 2026,
      articleTitle: 'Quantum-Resilient Lattice Cryptography for Aerospace Telemetry',
      articleSubtitle: 'Microsecond Latencies on Radiation-Hardened FPGA',
      authors: [
        {
          firstName: 'Amina',
          lastName: 'Patel',
          affiliation: 'National University of Singapore',
          orcid: '0000-0002-8812-7095',
          isCorresponding: true,
          sequence: 'first',
        },
      ],
      doi: '10.5555/jstai.2026.003',
      resourcePublicUrl: 'http://localhost:3000/articles/art-003',
      citationList: [
        {
          orderIndex: 1,
          rawText: 'Lyubashevsky, V. (2012). Lattice Signatures without Trapdoors.',
          doi: '10.5555/eurocrypt.2012.01',
        },
      ],
    };

    const xml = generateCrossrefXML(payload);

    expect(xml).toContain('xmlns="http://www.crossref.org/schema/5.3.1"');
    expect(xml).toContain('<full_title>Journal of Science, Technology &amp; AI</full_title>');
    expect(xml).toContain('<issn media_type="print">2834-9102</issn>');
    expect(xml).toContain('<issn media_type="electronic">2834-9110</issn>');
    expect(xml).toContain('<volume>1</volume>');
    expect(xml).toContain('<issue>1</issue>');
    expect(xml).toContain('<title>Quantum-Resilient Lattice Cryptography for Aerospace Telemetry</title>');
    expect(xml).toContain('<given_name>Amina</given_name>');
    expect(xml).toContain('<surname>Patel</surname>');
    expect(xml).toContain('<ORCID authenticated="true">https://orcid.org/0000-0002-8812-7095</ORCID>');
    expect(xml).toContain('<doi>10.5555/jstai.2026.003</doi>');
    expect(xml).toContain('<resource>http://localhost:3000/articles/art-003</resource>');
    expect(xml).toContain('<citation key="ref_1">');
    expect(xml).toContain('<doi>10.5555/eurocrypt.2012.01</doi>');
  });

  it('safely escapes XML special characters in titles and affiliations', () => {
    const payload: CrossrefMetadataPayload = {
      journalTitle: 'Test & Review',
      journalAbbr: 'T&R',
      publicationYear: 2026,
      articleTitle: 'Algorithms <for> "Deep Learning" & Logic',
      authors: [
        {
          firstName: 'Alice',
          lastName: 'O\'Connor',
          affiliation: 'Dept of CS & AI',
          isCorresponding: true,
          sequence: 'first',
        },
      ],
      doi: '10.5555/test.2026.001',
      resourcePublicUrl: 'http://localhost:3000/articles/1',
    };

    const xml = generateCrossrefXML(payload);
    expect(xml).toContain('&lt;for&gt;');
    expect(xml).toContain('&quot;Deep Learning&quot; &amp; Logic');
    expect(xml).toContain('O&apos;Connor');
  });
});
