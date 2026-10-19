import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Migrating Journal columns in PostgreSQL...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Journal" ADD COLUMN IF NOT EXISTS "aboutDetails" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Journal" ADD COLUMN IF NOT EXISTS "privacyStatement" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Journal" ADD COLUMN IF NOT EXISTS "contactDetails" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Journal" ADD COLUMN IF NOT EXISTS "authorGuidelines" TEXT;`);
    console.log('Columns added or verified successfully.');

    const journals = await prisma.journal.findMany();
    console.log(`Found ${journals.length} journals to update with default content.`);

    for (const j of journals) {
      const defaultAbout = j.aboutDetails || `### About ${j.title}\n\n**${j.title}** (${j.abbreviation}) is a premier, peer-reviewed international academic journal published under **NextGen Innovation & Research Journals**. The journal is dedicated to advancing theoretical and applied scholarly research through high-impact, rigorously reviewed contributions.\n\n#### Aims and Scope\n${j.aimsScope || j.description}\n\n#### Open Access Mandate\nAll articles published in ${j.title} are made permanently and freely accessible online immediately upon publication under the terms of the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**. Authors retain full copyright of their intellectual output.\n\n#### Peer Review and Archiving\nWe employ a strict double-anonymous peer review protocol to guarantee objective, merit-based evaluations. All published manuscripts receive a Crossref Digital Object Identifier (DOI) and are digitally preserved across institutional and global scholarly indexing networks including Google Scholar.`;

      const defaultPrivacy = j.privacyStatement || `### Scholarly Privacy Statement — ${j.title}\n\n**NextGen Innovation & Research Journals** and the editorial board of **${j.title}** are dedicated to protecting the privacy, identity, and personal information of our contributing authors, reviewers, editors, and platform visitors.\n\n#### 1. Personal Information Collected\nThe names, institutional affiliations, academic credentials, ORCID identifiers, and email addresses entered in this journal site will be used exclusively for the stated purposes of scholarly communication, peer review management, and publication administration. They will not be made available for any commercial purpose or shared with third parties.\n\n#### 2. Confidentiality of Manuscript Submissions\nUnpublished manuscripts submitted to ${j.title} remain strictly confidential intellectual property. Editors, section editors, and external reviewers are bound by non-disclosure ethics and must not share, cite, or exploit manuscript materials or data prior to formal publication.\n\n#### 3. Reviewer Anonymity\nIn accordance with our **Double-Anonymous Peer Review Policy**, the identities of referees are kept strictly confidential from authors and the public. Reviewer reports are transmitted through the editorial system without revealing referee identities.\n\n#### 4. Post-Publication Archiving and Attribution\nUpon formal publication, author names, affiliations, article metadata, and registered DOIs enter the permanent public scientific record. Metadata is deposited with Crossref, Google Scholar, and scholarly indexing repositories to ensure persistent attribution.\n\n#### 5. Contact Regarding Privacy Inquiries\nQuestions regarding data protection or requests to update personal information may be addressed directly to the Editorial Office at **${j.contactEmail || 'nextgenjournals@gmail.com'}**.`;

      const defaultContact = j.contactDetails || `### Editorial Office & Inquiries — ${j.title}\n\n**${j.title}** (${j.abbreviation})\n*Published by NextGen Innovation & Research Journals*\n\n#### Primary Editorial Office\n- **Editorial Inquiries:** [${j.contactEmail || 'nextgenjournals@gmail.com'}](mailto:${j.contactEmail || 'nextgenjournals@gmail.com'})\n- **General Publisher Support:** [nextgenjournals@gmail.com](mailto:nextgenjournals@gmail.com)\n- **Office Location:** NextGen Innovation & Research Directorate, Lagos, Nigeria\n\n#### Editorial Leadership & Desk Inquiries\n- **Editor-in-Chief Office:** Available for scope determinations, pre-submission inquiries, and special issue proposals.\n- **Production & Typesetting Desk:** For queries regarding proof corrections, DOI resolution, and PDF downloads.\n- **Ethics & Review Integrity:** For queries regarding double-anonymous refereeing and publication ethics compliance.\n\n*Response Time: The editorial office typically responds to formal author inquiries within 24 to 48 hours.*`;

      await prisma.journal.update({
        where: { id: j.id },
        data: {
          aboutDetails: defaultAbout,
          privacyStatement: defaultPrivacy,
          contactDetails: defaultContact,
        },
      });
      console.log(`Updated journal: ${j.slug}`);
    }

    console.log('ALL JOURNALS SUCCESSFULLY INITIALIZED!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
