import nodemailer from 'nodemailer';
import { getBaseUrl } from './siteUrl';

// Configuration interface
export interface EmailConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
}

export function getEmailConfig(): EmailConfig {
  return {
    host: process.env.EMAIL_SERVER_HOST || '',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
    user: process.env.EMAIL_SERVER_USER || '',
    pass: process.env.EMAIL_SERVER_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'NextGen Innovation & Research Journals <nextgenjournals@gmail.com>',
  };
}

export function isSmtpConfigured(): boolean {
  const config = getEmailConfig();
  if (!config.host || config.host === 'smtp.example.com' || config.host.includes('placeholder')) {
    return false;
  }
  return Boolean(config.user && config.pass);
}

// Cached Nodemailer transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!transporter) {
    const config = getEmailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true for 465, false for 587 / other ports
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  return transporter;
}

// Master Scholarly Email HTML Template Generator
export function renderScholarlyEmail({
  title,
  preheader,
  badgeText,
  badgeColor = '#2563eb', // default blue
  recipientName,
  introParagraphs,
  detailsTable,
  actionButton,
  footnote,
  additionalSections,
}: {
  title: string;
  preheader: string;
  badgeText?: string;
  badgeColor?: string;
  recipientName?: string;
  introParagraphs: string[];
  detailsTable?: Array<{ label: string; value: string }>;
  actionButton?: { text: string; url: string };
  footnote?: string;
  additionalSections?: Array<{ title: string; content: string }>;
}): string {
  const portalUrl = getBaseUrl();
  const fullActionUrl = actionButton
    ? actionButton.url.startsWith('http')
      ? actionButton.url
      : `${portalUrl}${actionButton.url}`
    : '';

  const detailsRows = detailsTable && detailsTable.length > 0
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #f8fafc; font-size: 13px;">
        <tbody>
          ${detailsTable.map((row, idx) => `
            <tr style="border-bottom: ${idx === detailsTable.length - 1 ? 'none' : '1px solid #e2e8f0'};">
              <td style="padding: 12px 16px; font-weight: 600; color: #334155; width: 34%; background-color: #f1f5f9; border-right: 1px solid #e2e8f0; vertical-align: top;">
                ${row.label}
              </td>
              <td style="padding: 12px 16px; color: #0f172a; word-break: break-word; line-height: 1.5;">
                ${row.value}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    : '';

  const buttonHtml = actionButton
    ? `
      <div style="text-align: center; margin: 32px 0 28px 0;">
        <a href="${fullActionUrl}" target="_blank" style="background-color: #1e3a8a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 2px 5px rgba(30, 58, 138, 0.25); letter-spacing: 0.2px;">
          ${actionButton.text} &rarr;
        </a>
      </div>
    `
    : '';

  const sectionsHtml = additionalSections && additionalSections.length > 0
    ? additionalSections.map(sec => `
      <div style="margin: 24px 0; padding: 18px 20px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 0 8px 8px 0; font-size: 13px;">
        <div style="font-weight: 700; color: #0b192c; font-size: 14px; margin-bottom: 8px;">
          ${sec.title}
        </div>
        <div style="color: #475569; line-height: 1.6;">
          ${sec.content}
        </div>
      </div>
    `).join('')
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Wrapper -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 660px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Scholarly Navy Header -->
          <tr>
            <td style="background-color: #0b192c; padding: 30px 36px; text-align: left; border-bottom: 3px solid #2563eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; font-family: 'Times New Roman', Times, serif;">
                      NextGen Innovation & Research Journals
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 4px; font-weight: 600;">
                      International Peer-Reviewed Open Access Scholarly Platform
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Container -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              ${badgeText ? `
                <div style="display: inline-block; padding: 5px 14px; background-color: ${badgeColor}15; border: 1px solid ${badgeColor}40; border-radius: 9999px; color: ${badgeColor}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 20px;">
                  ${badgeText}
                </div>
              ` : ''}

              <h1 style="font-size: 22px; font-weight: 700; color: #0b192c; margin: 0 0 18px 0; line-height: 1.35; font-family: 'Times New Roman', Times, serif;">
                ${title}
              </h1>

              ${recipientName ? `
                <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0; font-weight: 600;">
                  Dear ${recipientName},
                </p>
              ` : ''}

              ${introParagraphs.map(p => `
                <p style="font-size: 14px; color: #334155; margin: 0 0 14px 0; line-height: 1.68;">
                  ${p}
                </p>
              `).join('')}

              ${detailsRows}

              ${sectionsHtml}

              ${buttonHtml}

              ${footnote ? `
                <div style="margin-top: 24px; padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #64748b; line-height: 1.6;">
                  <strong>Important Notice:</strong> ${footnote}
                </div>
              ` : ''}

              <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
                <p style="margin: 0 0 4px 0; font-weight: 700; color: #0b192c;">Editorial Directorate</p>
                <p style="margin: 0; color: #475569;">NextGen Innovation & Research Journals</p>
                <p style="margin: 2px 0 0 0; color: #64748b; font-size: 12px;">Global Scholarly Publishing Office</p>
                <p style="margin: 6px 0 0 0; color: #2563eb; font-size: 13px;">
                  <a href="mailto:nextgenjournals@gmail.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">nextgenjournals@gmail.com</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Scholarly Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 26px 36px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.65;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #334155;">
                NextGen Innovation & Research Journals
              </p>
              <p style="margin: 0 0 10px 0; color: #64748b;">
                Crossref Digital Object Identifier (DOI) Member • Committee on Publication Ethics (COPE) Compliant • Budapest Open Access Initiative (BOAI) Supported
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 10px; line-height: 1.5;">
                This formal administrative dispatch was generated through the NextGen Innovation & Research Journals editorial workflow system. All published research articles are made immediately and permanently available under the Creative Commons Attribution 4.0 International License (CC BY 4.0).
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Core dispatch function
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; simulated?: boolean; messageId?: string; error?: string }> {
  const config = getEmailConfig();

  // If plain text wasn't provided, generate a basic strip of the HTML
  const plainText = text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // Check if live SMTP is configured
  if (!isSmtpConfigured()) {
    console.log(`\n================== [NEXTGEN INNOVATION & RESEARCH JOURNALS EMAIL DISPATCH (SIMULATION)] ==================`);
    console.log(`To: ${to}`);
    console.log(`From: ${config.from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Status: SMTP credentials not yet provided in .env/Vercel (Simulated delivery)`);
    console.log(`Host: ${config.host || '(not set)'}`);
    console.log(`=========================================================================================================\n`);
    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  try {
    const client = getTransporter();
    if (!client) {
      throw new Error('Transporter unavailable');
    }

    const info = await client.sendMail({
      from: config.from,
      to,
      subject,
      html,
      text: plainText,
    });

    console.log(`[EMAIL DISPATCH SUCCESS] MessageId: ${info.messageId} | Recipient: ${to}`);
    return {
      success: true,
      simulated: false,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] Failed to send email to ${to}:`, err.message);
    return {
      success: false,
      simulated: false,
      error: err.message,
    };
  }
}

// ---------------------------------------------------------------------------
// High-Level Pre-Designed Scholarly Notification Workflows
// ---------------------------------------------------------------------------

// 1. Welcome / Member Signup
export async function sendWelcomeEmail({
  toEmail,
  name,
}: {
  toEmail: string;
  name?: string;
}) {
  const displayName = name || 'Respected Scholar';
  const html = renderScholarlyEmail({
    title: 'Welcome to NextGen Innovation & Research Journals',
    preheader: 'Your academic scholar portal account has been established.',
    badgeText: 'Scholar Account Provisioned',
    badgeColor: '#2563eb',
    recipientName: displayName,
    introParagraphs: [
      'On behalf of the Editorial Board and Governing Council, we are pleased to welcome you to the <strong>NextGen Innovation & Research Journals</strong> scholarly community. Your academic user profile has been successfully provisioned within our centralized editorial and publication infrastructure.',
      'Through this unified scholar portal, you have direct access to our multidisciplinary journal collection. You may submit original research manuscripts, participate in double-anonymous peer review, monitor continuous editorial decisions in real-time, and download open-access scholarly publications.',
      'Our platform is built upon international standards of scholarly transparency and open scientific dissemination. All accepted manuscripts receive a permanent Crossref Digital Object Identifier (DOI) and are indexed across Google Scholar, Crossref, and leading academic repositories.',
    ],
    detailsTable: [
      { label: 'Registered Email', value: toEmail },
      { label: 'Primary Roles', value: 'Author, Reader & Prospective Reviewer' },
      { label: 'Publishing Model', value: 'Diamond Open Access (No Author Publication Fees)' },
      { label: 'Licensing Standard', value: 'Creative Commons Attribution 4.0 International (CC BY 4.0)' },
      { label: 'Persistent Identifiers', value: 'Crossref DOI & Highwire Press Academic Meta Tags' },
    ],
    additionalSections: [
      {
        title: 'Complete Your Academic Profile',
        content: 'To maximize visibility and facilitate accurate editorial matchmaking for peer review invitations, please navigate to your dashboard and verify your institutional affiliation, department, biographical summary, and 16-digit ORCID identifier (e.g., 0000-0002-1825-0097).',
      },
      {
        title: 'Editorial Standards & Ethics',
        content: 'NextGen Innovation & Research Journals adheres strictly to the Committee on Publication Ethics (COPE) Code of Conduct. We maintain a zero-tolerance policy regarding plagiarism, data fabrication, and improper duplicate submission. All submitted manuscripts are screened using automated similarity analysis.',
      },
    ],
    actionButton: {
      text: 'Access Your Scholar Dashboard',
      url: '/dashboard/author',
    },
    footnote: 'Please safeguard your account credentials. The Editorial Office will never ask for your confidential password under any circumstances.',
  });

  return sendEmail({
    to: toEmail,
    subject: 'Welcome to NextGen Innovation & Research Journals | Scholar Portal',
    html,
  });
}

// 2. Manuscript Submission Confirmation (Author)
export async function sendSubmissionConfirmationEmail({
  toEmail,
  authorName,
  submissionNumber,
  title,
  journalTitle,
  submissionId,
}: {
  toEmail: string;
  authorName: string;
  submissionNumber: string;
  title: string;
  journalTitle: string;
  submissionId: string;
}) {
  const html = renderScholarlyEmail({
    title: `Manuscript Submission Acknowledged: [${submissionNumber}]`,
    preheader: `Your research paper "${title}" has been successfully logged with ${journalTitle}.`,
    badgeText: 'Manuscript Officially Received',
    badgeColor: '#4f46e5',
    recipientName: authorName,
    introParagraphs: [
      `Thank you for submitting your original scholarly research manuscript to <strong>${journalTitle}</strong>, published under NextGen Innovation & Research Journals.`,
      `We formally acknowledge receipt of your manuscript titled <em>"${title}"</em>. Your submission has been entered into the centralized editorial database under reference identifier <strong>${submissionNumber}</strong>.`,
      'Your work has now entered the initial editorial pipeline and is assigned to the Section Editor for preliminary desk screening. This includes compliance checks against our author instructions, scope verification, ethical disclosures, and similarity index screening.',
    ],
    detailsTable: [
      { label: 'Reference Number', value: submissionNumber },
      { label: 'Target Journal', value: journalTitle },
      { label: 'Manuscript Title', value: title },
      { label: 'Peer Review Model', value: 'Double-Anonymous (COPE Compliant)' },
      { label: 'Official Receipt Date', value: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
      { label: 'Editorial Office Desk', value: 'Desk Screening & Integrity Verification' },
    ],
    additionalSections: [
      {
        title: 'What Happens Next in the Review Process?',
        content: '1. <strong>Desk Screening (1–3 Days):</strong> The Editor-in-Chief reviews the manuscript for alignment with the journal scope and overall technical soundess.<br />2. <strong>Peer Review (14–21 Days):</strong> Qualified independent peer reviewers with recognized subject expertise are invited to evaluate technical rigor, methodology, and conclusions.<br />3. <strong>Editorial Decision:</strong> You will receive a formal notification containing referee reports and the editorial board’s decision (Accept, Revisions, or Decline).',
      },
      {
        title: 'Author Archiving Rights & Open Access',
        content: 'Upon acceptance, your article will be published open access under the Creative Commons Attribution 4.0 International License (CC BY 4.0). You retain full copyright ownership and have unconditional permission to deposit preprint, postprint, and published PDF versions into institutional repositories and preprint servers.',
      },
    ],
    actionButton: {
      text: 'Track Real-Time Manuscript Progress',
      url: `/dashboard/author`,
    },
    footnote: 'Please quote your unique manuscript tracking reference in all subsequent correspondence with the editorial office.',
  });

  return sendEmail({
    to: toEmail,
    subject: `Submission Acknowledgment [${submissionNumber}]: ${title}`,
    html,
  });
}

// 3. New Submission Alert for Editors
export async function sendEditorSubmissionAlertEmail({
  toEmail,
  editorName,
  submissionNumber,
  title,
  journalTitle,
  submissionId,
}: {
  toEmail: string;
  editorName: string;
  submissionNumber: string;
  title: string;
  journalTitle: string;
  submissionId: string;
}) {
  const html = renderScholarlyEmail({
    title: `Editorial Action Required: New Manuscript [${submissionNumber}]`,
    preheader: `A new manuscript has been submitted to ${journalTitle} awaiting desk screening.`,
    badgeText: 'New Submission for Screening',
    badgeColor: '#d97706',
    recipientName: editorName,
    introParagraphs: [
      `A new scholarly manuscript has been received for <strong>${journalTitle}</strong> and requires your editorial evaluation.`,
      `The manuscript titled <em>"${title}"</em> has been logged under reference identifier <strong>${submissionNumber}</strong> and is currently in the "Submitted" status awaiting initial desk screening and reviewer delegation.`,
      'As a managing editor, you are invited to inspect the full manuscript file, evaluate alignment with the journal’s aims and scope, review author declarations, and determine whether to proceed with double-anonymous peer review or render a desk decision.',
    ],
    detailsTable: [
      { label: 'Reference ID', value: submissionNumber },
      { label: 'Target Journal', value: journalTitle },
      { label: 'Manuscript Title', value: title },
      { label: 'Current Stage', value: 'Queued for Editorial Desk Screening' },
      { label: 'Review Framework', value: 'Double-Anonymous Peer Review' },
    ],
    additionalSections: [
      {
        title: 'Recommended Desk Screening Checklist',
        content: '• Confirm manuscript falls strictly within the published aims and scope of the journal.<br />• Verify author declarations regarding conflict of interest, ethical approval, and funding.<br />• Ensure manuscript files are properly anonymized for double-anonymous review.<br />• Check word count, abstract structure, and referencing compliance.',
      },
    ],
    actionButton: {
      text: 'Open Editorial Desk & Manage Submission',
      url: `/dashboard/editor`,
    },
    footnote: 'Timely initial screening ensures our benchmark of 3-day desk turnaround for all authors.',
  });

  return sendEmail({
    to: toEmail,
    subject: `[Editorial Desk] New Submission ${submissionNumber} - ${journalTitle}`,
    html,
  });
}

// 4. Peer Reviewer Invitation & Assignment
export async function sendReviewerAssignmentEmail({
  toEmail,
  reviewerName,
  submissionNumber,
  title,
  journalTitle,
  dueDate,
}: {
  toEmail: string;
  reviewerName: string;
  submissionNumber: string;
  title: string;
  journalTitle: string;
  dueDate?: string;
}) {
  const html = renderScholarlyEmail({
    title: `Peer Review Invitation: [${submissionNumber}]`,
    preheader: `You have been selected to evaluate a scholarly manuscript for ${journalTitle}.`,
    badgeText: 'Peer Review Invitation',
    badgeColor: '#0284c7',
    recipientName: reviewerName,
    introParagraphs: [
      `In recognition of your scholarly contributions and academic expertise in this field, the Editorial Board of <strong>${journalTitle}</strong> cordially invites you to serve as an expert peer reviewer for the manuscript referenced below.`,
      `<strong>Manuscript Title:</strong> <em>"${title}"</em>`,
      'NextGen Innovation & Research Journals operates under a rigorous double-anonymous peer review model. The identity of the author(s) has been strictly withheld to guarantee impartial and objective academic evaluation. Likewise, your identity will remain strictly confidential and will not be disclosed to the authors.',
    ],
    detailsTable: [
      { label: 'Reference ID', value: submissionNumber },
      { label: 'Journal', value: journalTitle },
      { label: 'Manuscript Title', value: title },
      { label: 'Evaluation Period', value: dueDate || '14 calendar days from invitation' },
      { label: 'Review Protocol', value: 'Double-Anonymous (COPE Guidelines)' },
    ],
    additionalSections: [
      {
        title: 'Reviewer Guidelines & Evaluation Criteria',
        content: 'When compiling your confidential evaluation and constructive feedback for the authors, please consider:<br />1. <strong>Originality & Significance:</strong> Does the study present novel contributions or important empirical findings?<br />2. <strong>Methodological Soundness:</strong> Are the research design, data collection, and analytical procedures technically sound and reproducible?<br />3. <strong>Data & Results:</strong> Are conclusions supported by the presented data, figures, and statistical evidence?<br />4. <strong>Clarity & Structure:</strong> Is the manuscript logically written and referenced according to academic standards?',
      },
      {
        title: 'Conflict of Interest & Ethical Undertaking',
        content: 'If you have a personal, financial, or direct professional connection with the authors or the work that could compromise objective assessment, please decline this invitation immediately so that an alternative referee may be appointed without delay.',
      },
    ],
    actionButton: {
      text: 'Accept Invitation & Access Reviewer Center',
      url: `/dashboard/reviewer`,
    },
    footnote: 'Thank you for your invaluable commitment to upholding scientific integrity and scholarly peer review standards.',
  });

  return sendEmail({
    to: toEmail,
    subject: `[Peer Review Invitation] ${journalTitle} - Manuscript ${submissionNumber}`,
    html,
  });
}

// 5. Editorial Decision (Acceptance, Revisions, Rejection)
export async function sendEditorialDecisionEmail({
  toEmail,
  authorName,
  submissionNumber,
  title,
  decision,
  comments,
  journalTitle,
}: {
  toEmail: string;
  authorName: string;
  submissionNumber: string;
  title: string;
  decision: 'ACCEPT' | 'MINOR_REVISION' | 'MAJOR_REVISION' | 'REJECT' | 'DESK_REJECT' | string;
  comments?: string;
  journalTitle: string;
}) {
  const isAccepted = decision === 'ACCEPT';
  const isRevision = decision === 'MINOR_REVISION' || decision === 'MAJOR_REVISION';

  let badgeText = 'Editorial Decision';
  let badgeColor = '#475569';
  let decisionSummary = '';
  let additionalSections: Array<{ title: string; content: string }> = [];

  if (isAccepted) {
    badgeText = 'Formal Acceptance Notice';
    badgeColor = '#059669';
    decisionSummary = `We are delighted to formally inform you that following rigorous double-anonymous peer review and editorial evaluation, your manuscript titled <em>"${title}"</em> has been <strong>officially accepted for publication</strong> in <strong>${journalTitle}</strong>.`;
    additionalSections = [
      {
        title: 'Production & Digital Object Identifier (DOI)',
        content: 'Your manuscript has now been transferred to the production desk. Our typesetters will generate the final scholarly PDF, assign a persistent Crossref Digital Object Identifier (DOI), and prepare the work for volume/issue indexing. You will be notified when your galley proof is finalized.',
      },
      {
        title: 'Licensing & Open Access Distribution',
        content: 'Your work will be published under the Creative Commons Attribution 4.0 International License (CC BY 4.0). Under this license, authors retain complete copyright ownership. Readers worldwide may read, download, copy, distribute, and cite your work freely.',
      },
    ];
  } else if (isRevision) {
    badgeText = `Decision: ${decision === 'MINOR_REVISION' ? 'Minor Revisions' : 'Major Revisions'} Requested`;
    badgeColor = '#ea580c';
    decisionSummary = `The double-anonymous peer review evaluation of your manuscript titled <em>"${title}"</em> is now complete. The consensus of the referees and the Editorial Board is that your paper demonstrates substantial scholarly value; however, <strong>revisions are required</strong> before a final determination on publication can be made.`;
    additionalSections = [
      {
        title: 'Instructions for Preparing Your Revised Manuscript',
        content: '1. Carefully examine all referee remarks and editorial feedback provided below.<br />2. Prepare a detailed <strong>Point-by-Point Rebuttal Document</strong> addressing every reviewer comment and explaining the specific changes made.<br />3. Submit your revised manuscript file along with the rebuttal document through your author dashboard.<br />4. All modifications in the revised manuscript should be clearly highlighted or tracked.',
      },
      {
        title: 'Revision Submission Timeline',
        content: 'Please upload your revised files within <strong>14 calendar days</strong> (for minor revisions) or <strong>28 calendar days</strong> (for major revisions) to ensure prompt re-evaluation by the editorial team.',
      },
    ];
  } else {
    badgeText = 'Decision: Manuscript Declined';
    badgeColor = '#64748b';
    decisionSummary = `Thank you for giving us the opportunity to consider your research manuscript titled <em>"${title}"</em> for publication in <strong>${journalTitle}</strong>. Following thorough technical assessment, the Editorial Board regretfully informs you that we are unable to accept your manuscript for publication in this journal.`;
    additionalSections = [
      {
        title: 'Editorial Context & Rationale',
        content: 'Due to the high volume of submissions and the specialized thematic scope of the journal, the Editorial Board must make difficult decisions. This determination does not necessarily reflect on the intrinsic merit or quality of your research, but rather its suitability for this specific venue at this time.',
      },
      {
        title: 'Future Submissions',
        content: 'We thank you for considering NextGen Innovation & Research Journals and encourage you to submit future original research to our platform.',
      },
    ];
  }

  const html = renderScholarlyEmail({
    title: `Editorial Determination: [${submissionNumber}]`,
    preheader: `An official editorial determination has been made regarding "${title}".`,
    badgeText,
    badgeColor,
    recipientName: authorName,
    introParagraphs: [
      decisionSummary,
      comments ? `<strong>Editorial Remarks & Reviewer Feedback:</strong><br /><div style="margin-top: 8px; padding: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-style: italic; color: #1e293b;">${comments}</div>` : '',
    ].filter(Boolean),
    detailsTable: [
      { label: 'Reference ID', value: submissionNumber },
      { label: 'Target Journal', value: journalTitle },
      { label: 'Manuscript Title', value: title },
      { label: 'Editorial Determination', value: decision.replace(/_/g, ' ') },
    ],
    additionalSections,
    actionButton: {
      text: isRevision ? 'Upload Revised Manuscript' : 'View Submission Details in Dashboard',
      url: `/dashboard/author`,
    },
    footnote: isAccepted
      ? 'Our production team will contact you regarding galley proofing before final issue publication.'
      : isRevision
      ? 'Please submit your itemized response to reviewer feedback along with your revised files.'
      : 'We appreciate your interest in our journal and wish you every success in placing your scholarship.',
  });

  const subjectOutcome = isAccepted ? 'Formal Acceptance' : isRevision ? 'Revisions Requested' : 'Editorial Determination';

  return sendEmail({
    to: toEmail,
    subject: `Editorial Decision [${subjectOutcome}] - ${submissionNumber}: ${title}`,
    html,
  });
}

// 6. Article Published Notification
export async function sendArticlePublishedEmail({
  toEmail,
  authorName,
  title,
  journalTitle,
  doi,
  articleId,
  citationString,
}: {
  toEmail: string;
  authorName: string;
  title: string;
  journalTitle: string;
  doi?: string;
  articleId: string;
  citationString?: string;
}) {
  const doiUrl = doi ? (doi.startsWith('http') ? doi : `https://doi.org/${doi}`) : '';
  const recommendedCitation = citationString || `${authorName}. (2026). "${title}". ${journalTitle}. ${doiUrl ? `DOI: ${doiUrl}` : ''}`;

  const html = renderScholarlyEmail({
    title: `Your Article Is Now Officially Published & Indexed!`,
    preheader: `Your research has been published in ${journalTitle} under CC BY 4.0.`,
    badgeText: 'Article Published & DOI Registered',
    badgeColor: '#0d9488',
    recipientName: authorName,
    introParagraphs: [
      `We are delighted to celebrate the official publication of your article in <strong>${journalTitle}</strong>, under <strong>NextGen Innovation & Research Journals</strong>.`,
      `Your paper titled <em>"${title}"</em> is now permanently recorded in the global scholarly literature, equipped with a persistent Digital Object Identifier (DOI) registered through Crossref, and fully open to readers across the world.`,
      'Your publication is immediately indexed for discoverability on Google Scholar, Crossref, and major international academic discovery engines with full Highwire Press meta tags.',
    ],
    detailsTable: [
      { label: 'Article Title', value: title },
      { label: 'Journal', value: journalTitle },
      { label: 'Digital Object Identifier', value: doi ? `<a href="${doiUrl}" style="color: #2563eb; text-decoration: underline;">${doi}</a>` : 'Crossref DOI Registered' },
      { label: 'Open Access License', value: 'Creative Commons Attribution 4.0 International (CC BY 4.0)' },
      { label: 'Official Citation', value: recommendedCitation },
    ],
    additionalSections: [
      {
        title: 'Maximize Your Research Impact & Dissemination',
        content: '• <strong>Institutional Repositories:</strong> You have unconditional permission to deposit the final published PDF in your university or institution’s open repository.<br />• <strong>Scholarly Networks:</strong> Upload and link your article to ResearchGate, Academia.edu, Mendeley, and your personal website.<br />• <strong>ORCID Integration:</strong> Add the publication to your ORCID profile using the DOI for seamless automatic indexing.<br />• <strong>Share with Colleagues:</strong> Disseminate the permanent DOI link on academic forums and social media.',
      },
    ],
    actionButton: {
      text: 'View Published Article & Download Typeset PDF',
      url: `/articles/${articleId}`,
    },
    footnote: 'Congratulations on this academic achievement. We thank you for choosing NextGen Innovation & Research Journals for your scholarly publication.',
  });

  return sendEmail({
    to: toEmail,
    subject: `[Published Article] ${title} - ${journalTitle}`,
    html,
  });
}
