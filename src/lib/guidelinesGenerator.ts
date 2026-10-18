export interface JournalInfoForGuidelines {
  title: string;
  abbreviation: string;
  slug: string;
  aimsScope: string;
  peerReviewPolicy: string;
  openAccessPolicy: string;
  licensingPolicy: string;
  apcInfo?: string | null;
  contactEmail: string;
  publisher?: string;
}

export function generateDefaultAuthorGuidelines(journal: JournalInfoForGuidelines): string {
  const currentYear = new Date().getFullYear();
  return `# Author Guidelines & Submission Instructions
**${journal.title} (${journal.abbreviation})**
*Published by ${journal.publisher || 'NextGen Innovation & Research Journals'} • ISSN Registered • Crossref Member*

---

## 1. Aims & Scope
${journal.title} welcomes original, high-impact contributions that advance scholarly knowledge and practical applications in:
> ${journal.aimsScope || 'Theoretical foundations, empirical investigations, computational paradigms, and interdisciplinary breakthroughs.'}

All manuscripts must represent rigorous, previously unpublished work and must not be under simultaneous consideration by any other journal or conference proceedings.

---

## 2. Article Types Accepted
1. **Original Research Articles**: Comprehensive empirical or theoretical studies presenting novel methodology, experimental validation, or critical breakthroughs (typically 5,000–9,000 words).
2. **Review Articles**: Critical syntheses of state-of-the-art developments, meta-analyses, and forward-looking research agendas (6,000–12,000 words).
3. **Short Communications**: Rapid reports of significant preliminary findings, novel algorithms, or urgent experimental observations (2,500–4,000 words).
4. **Technical Reports & Case Studies**: Detailed implementations, industrial deployments, benchmarking analyses, or institutional evaluations (3,000–6,000 words).

---

## 3. Manuscript Preparation & Formatting

### 3.1 Accepted File Formats
- **Microsoft Word (.docx, .doc)**: Prepared using standard 11pt or 12pt font (Times New Roman, Arial, or Calibri), 1.5 line spacing, and standard margins.
- **Portable Document Format (.pdf)**: High-resolution typeset or preprint manuscripts with embedded fonts and clear section numbering.

### 3.2 Manuscript Structure
Submissions should be organized into the following clear structural divisions:
- **Title**: Clear, concise, and informative (avoid abbreviations where possible).
- **Author Information**: Full names, institutional affiliations, city, country, ORCID identifiers, and designated corresponding author email.
- **Abstract**: An unstructured or structured summary of 150–250 words outlining the background, core problem, methodology, key findings, and scholarly significance.
- **Keywords**: 4 to 6 relevant index terms for Google Scholar and bibliographic discovery.
- **Main Text**:
  - Introduction (background, problem statement, research questions)
  - Literature Review / Related Work
  - Methodology / System Architecture / Materials & Methods
  - Results / Empirical Evaluation (incorporating clear numbered tables and figures)
  - Discussion (implications, limitations, comparative assessment)
  - Conclusions & Future Work
- **Declarations & Statements**:
  - Funding Information (grant numbers, sponsoring institutions, or "None declared")
  - Conflict of Interest statement
  - Data Availability Statement
  - Ethical Approval & Informed Consent (for human/animal studies)
  - Acknowledgements
- **References**: Numbered or APA citation format with full DOIs included wherever available.

### 3.3 Tables and Figures
- Tables must be numbered consecutively with descriptive captions above each table.
- Include standard academic gridlines, clear header rows, and units of measurement.
- Figures must have a minimum resolution of 300 DPI with descriptive figure legends beneath.

---

## 4. Peer Review Process & Editorial Workflow
- **Review Model**: ${journal.peerReviewPolicy || 'Double-anonymous peer review'}.
- **Initial Desk Review**: The Editor-in-Chief and Associate Editors conduct an initial assessment of scope, novelty, and academic integrity within 3–5 working days.
- **External Evaluation**: Suitable manuscripts are assigned to at least two independent expert peer reviewers with verified subject-matter expertise.
- **Typical Turnaround**: First editorial decision is rendered within 2–4 weeks from submission.
- **Review Decisions**:
  - *Accept*: Accepted without modifications for immediate production.
  - *Minor Revision*: Revisions requested within 14 days; no secondary review required.
  - *Major Revision*: Substantial modifications or additional experiments required within 30 days, followed by re-evaluation.
  - *Reject*: Manuscript does not meet the journal's threshold for novelty, methodological rigor, or scope.

---

## 5. Open Access, Licensing & Publication Fees
- **Open Access License**: All accepted articles are immediately and permanently free for anyone to read, download, share, and cite under the **${journal.licensingPolicy || 'Creative Commons Attribution 4.0 International (CC BY 4.0)'}** license.
- **Article Processing Charges (APCs)**: ${journal.apcInfo || 'No publication fees or article processing charges for authors during the inaugural volume period.'}
- **Author Copyright**: Authors retain unrestricted copyright and all proprietary publishing rights for their published work.

---

## 6. Publication Ethics & Academic Integrity
${journal.title} strictly adheres to the guidelines established by the Committee on Publication Ethics (COPE):
- **Plagiarism Policy**: All submitted manuscripts are screened for text similarity. Similarity indices exceeding standard disciplinary thresholds will result in immediate desk rejection.
- **AI-Assisted Writing & Coding**: Generative AI tools (such as Large Language Models) may only be used for language editing and preliminary drafting assistance. AI tools cannot be listed as authors. Authors must disclose any AI tool usage in the Acknowledgements or Methodology section.
- **Corrections & Retractions**: The editorial team maintains transparent procedures for issuing errata, expressions of concern, and formal retractions in compliance with COPE standards.

---

## 7. Editorial Office Inquiries
For questions regarding manuscript suitability, special thematic issues, or editorial board appointments, please contact the editorial office:
- **Email**: [${journal.contactEmail}](mailto:${journal.contactEmail})
- **Publisher**: NextGen Innovation & Research Journals (Lagos, Nigeria)
- **Portal**: [https://nextgen-press.org/journals/${journal.slug}](https://nextgen-press.org/journals/${journal.slug})
`;
}
