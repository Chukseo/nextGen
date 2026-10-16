import nodemailer from 'nodemailer';

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
    from: process.env.EMAIL_FROM || 'NextGen Press Editorial <editorial@nextgen-press.org>',
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
}): string {
  const portalUrl = process.env.NEXTAUTH_URL || 'https://nextgen-press.org';
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
              <td style="padding: 10px 16px; font-weight: 600; color: #475569; width: 35%; background-color: #f1f5f9; border-right: 1px solid #e2e8f0;">
                ${row.label}
              </td>
              <td style="padding: 10px 16px; color: #0f172a; word-break: break-word;">
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
      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="${fullActionUrl}" target="_blank" style="background-color: #1e3a8a; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          ${actionButton.text} &rarr;
        </a>
      </div>
    `
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

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Wrapper -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Scholarly Navy Header -->
          <tr>
            <td style="background-color: #0b192c; padding: 28px 32px; text-align: left; border-bottom: 3px solid #2563eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                      NextGen Research & Innovation Press
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">
                      Peer-Reviewed Open Access Publishing
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Container -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              ${badgeText ? `
                <div style="display: inline-block; padding: 4px 12px; background-color: ${badgeColor}15; border: 1px solid ${badgeColor}40; border-radius: 9999px; color: ${badgeColor}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px;">
                  ${badgeText}
                </div>
              ` : ''}

              <h1 style="font-size: 20px; font-weight: 700; color: #0b192c; margin: 0 0 16px 0; line-height: 1.4;">
                ${title}
              </h1>

              ${recipientName ? `
                <p style="font-size: 15px; color: #334155; margin: 0 0 16px 0;">
                  Dear <strong>${recipientName}</strong>,
                </p>
              ` : ''}

              ${introParagraphs.map(p => `
                <p style="font-size: 14px; color: #334155; margin: 0 0 14px 0; line-height: 1.65;">
                  ${p}
                </p>
              `).join('')}

              ${detailsRows}

              ${buttonHtml}

              ${footnote ? `
                <p style="font-size: 12px; color: #64748b; font-style: italic; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                  ${footnote}
                </p>
              ` : ''}

              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #0b192c;">Editorial Office</p>
                <p style="margin: 0; color: #64748b;">NextGen Research and Innovation Press</p>
                <p style="margin: 4px 0 0 0; color: #2563eb;">
                  <a href="mailto:editorial@nextgen-press.org" style="color: #2563eb; text-decoration: none;">editorial@nextgen-press.org</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Scholarly Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">
                NextGen Research and Innovation Press • Cambridge, MA & London, UK
              </p>
              <p style="margin: 0 0 10px 0;">
                Crossref Digital Object Identifier (DOI) Member • Committee on Publication Ethics (COPE) Compliant
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 10px;">
                This is an automated administrative notification dispatched regarding your academic engagement.
                All published works are distributed under the Creative Commons Attribution 4.0 International License (CC BY 4.0).
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
    console.log(`\n================== [NEXTGEN PRESS EMAIL DISPATCH (SIMULATION)] ==================`);
    console.log(`To: ${to}`);
    console.log(`From: ${config.from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Status: SMTP credentials not yet provided in .env/Vercel (Simulated delivery)`);
    console.log(`Host: ${config.host || '(not set)'}`);
    console.log(`=================================================================================\n`);
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
  const displayName = name || 'Scholar';
  const html = renderScholarlyEmail({
    title: 'Welcome to NextGen Research and Innovation Press',
    preheader: 'Your academic scholar portal account has been established.',
    badgeText: 'New Scholar Account',
    badgeColor: '#2563eb',
    recipientName: displayName,
    introParagraphs: [
      'Welcome to the NextGen Research & Innovation Press publishing platform. Your scholarly account has been successfully provisioned.',
      'Through this unified academic portal, you can submit original manuscripts, monitor double-anonymous peer review progress, track editorial decisions, and explore peer-reviewed open access scholarship across our multidisciplinary journals.',
    ],
    detailsTable: [
      { label: 'Registered Email', value: toEmail },
      { label: 'Primary Roles', value: 'Author & Reader' },
      { label: 'Licensing Policy', value: 'Diamond Open Access (CC BY 4.0)' },
      { label: 'DOI Infrastructure', value: 'Crossref Automated Registration' },
    ],
    actionButton: {
      text: 'Access Scholar Dashboard',
      url: '/dashboard/author',
    },
    footnote: 'Please update your affiliation, biographical statement, and ORCID identifier in your profile to facilitate reviewer assignment.',
  });

  return sendEmail({
    to: toEmail,
    subject: 'Welcome to NextGen Research and Innovation Press | Scholar Portal',
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
    title: `Submission Received: ${submissionNumber}`,
    preheader: `Your manuscript "${title}" has been successfully logged.`,
    badgeText: 'Manuscript Logged',
    badgeColor: '#4f46e5',
    recipientName: authorName,
    introParagraphs: [
      `Thank you for submitting your research manuscript to <strong>${journalTitle}</strong>.`,
      'Your submission has entered the editorial workflow and is currently queued for initial desk screening by the Section Editors. You will be notified immediately once peer reviewers are assigned or an editorial determination is made.',
    ],
    detailsTable: [
      { label: 'Reference Number', value: submissionNumber },
      { label: 'Target Journal', value: journalTitle },
      { label: 'Manuscript Title', value: title },
      { label: 'Review Model', value: 'Double-Anonymous Peer Review' },
      { label: 'Submission Date', value: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) },
    ],
    actionButton: {
      text: 'Track Manuscript Status',
      url: `/dashboard/author`,
    },
    footnote: 'Please cite your reference number in all correspondence with the editorial office.',
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
    title: `Action Required: New Manuscript [${submissionNumber}]`,
    preheader: `A new manuscript has been submitted to ${journalTitle} awaiting desk screening.`,
    badgeText: 'Editorial Action',
    badgeColor: '#d97706',
    recipientName: editorName,
    introParagraphs: [
      `A new scholarly manuscript has been logged in <strong>${journalTitle}</strong> and requires initial editorial screening.`,
      'Please inspect the manuscript files, verify compliance with author guidelines, and either initiate double-anonymous peer reviewer assignments or render a preliminary desk evaluation.',
    ],
    detailsTable: [
      { label: 'Reference ID', value: submissionNumber },
      { label: 'Journal', value: journalTitle },
      { label: 'Manuscript Title', value: title },
      { label: 'Status', value: 'Queued for Desk Screening' },
    ],
    actionButton: {
      text: 'Open Editorial Desk',
      url: `/dashboard/editor`,
    },
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
    title: `Peer Review Invitation: ${submissionNumber}`,
    preheader: `You have been selected to evaluate a manuscript for ${journalTitle}.`,
    badgeText: 'Peer Review Request',
    badgeColor: '#0284c7',
    recipientName: reviewerName,
    introParagraphs: [
      `In recognition of your academic expertise, the editorial board of <strong>${journalTitle}</strong> cordially invites you to review the scholarly manuscript referenced below.`,
      'NextGen Press operates under a rigorous double-anonymous review procedure. The author identities have been withheld to guarantee impartial evaluation. Please submit your technical assessment, rigor checks, and recommendation via the Reviewer Portal.',
    ],
    detailsTable: [
      { label: 'Reference ID', value: submissionNumber },
      { label: 'Journal', value: journalTitle },
      { label: 'Manuscript Title', value: title },
      { label: 'Review Due Date', value: dueDate || '14 days from notification' },
      { label: 'Review Protocol', value: 'Double-Anonymous (COPE Guidelines)' },
    ],
    actionButton: {
      text: 'Access Reviewer Center',
      url: `/dashboard/reviewer`,
    },
    footnote: 'If you have a potential conflict of interest regarding this work, please contact the editorial office immediately to decline the invitation.',
  });

  return sendEmail({
    to: toEmail,
    subject: `[Review Request] ${journalTitle} - Manuscript ${submissionNumber}`,
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

  if (isAccepted) {
    badgeText = 'Decision: Accepted';
    badgeColor = '#059669';
    decisionSummary = `Congratulations! We are delighted to inform you that your manuscript has been formally accepted for publication in <strong>${journalTitle}</strong>. It will now advance to production formatting and Crossref DOI registration.`;
  } else if (isRevision) {
    badgeText = `Decision: ${decision === 'MINOR_REVISION' ? 'Minor Revisions' : 'Major Revisions'} Required`;
    badgeColor = '#ea580c';
    decisionSummary = `Following peer review evaluation of your manuscript by the expert referees, the editorial board requests that you revise your work in response to the reviewer and editor remarks detailed below.`;
  } else {
    badgeText = 'Decision: Declined';
    badgeColor = '#64748b';
    decisionSummary = `Thank you for submitting your research to <strong>${journalTitle}</strong>. Following thorough technical assessment, the editorial board regretfully informs you that we are unable to accept your manuscript for publication.`;
  }

  const html = renderScholarlyEmail({
    title: `Editorial Decision: ${submissionNumber}`,
    preheader: `An editorial determination has been made regarding "${title}".`,
    badgeText,
    badgeColor,
    recipientName: authorName,
    introParagraphs: [
      decisionSummary,
      comments ? `<strong>Editorial Remarks & Feedback:</strong><br /><em>${comments}</em>` : '',
    ].filter(Boolean),
    detailsTable: [
      { label: 'Reference ID', value: submissionNumber },
      { label: 'Journal', value: journalTitle },
      { label: 'Manuscript Title', value: title },
      { label: 'Outcome Status', value: decision.replace(/_/g, ' ') },
    ],
    actionButton: {
      text: isRevision ? 'Submit Manuscript Revision' : 'View Portal Details',
      url: `/dashboard/author`,
    },
    footnote: isAccepted
      ? 'Our production team will contact you regarding galley proofing before final issue publication.'
      : isRevision
      ? 'Please submit your itemized response to reviewer feedback along with your revised DOC/DOCX files.'
      : 'We appreciate the opportunity to consider your scholarship and wish you success in placing your manuscript.',
  });

  const subjectOutcome = isAccepted ? 'Accepted' : isRevision ? 'Revisions Requested' : 'Decision';

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
  const html = renderScholarlyEmail({
    title: `Your Article Is Now Officially Published!`,
    preheader: `Your paper has been published in ${journalTitle} under CC BY 4.0.`,
    badgeText: 'Article Published & DOI Registered',
    badgeColor: '#0d9488',
    recipientName: authorName,
    introParagraphs: [
      `We are pleased to announce that your article has been officially published in <strong>${journalTitle}</strong>.`,
      'Your work is now openly accessible to the international scholarly community under the Creative Commons Attribution 4.0 International License (CC BY 4.0), and is permanently citable via Crossref DOI infrastructure.',
    ],
    detailsTable: [
      { label: 'Article Title', value: title },
      { label: 'Journal', value: journalTitle },
      { label: 'Digital Object Identifier', value: doi || 'Crossref Registration Pending' },
      { label: 'Recommended Citation', value: citationString || `${authorName}. (2026). ${title}. ${journalTitle}.` },
    ],
    actionButton: {
      text: 'View Published Article & Download PDF',
      url: `/articles/${articleId}`,
    },
    footnote: 'You are encouraged to deposit this published version in your institutional repository, ResearchGate, or personal website.',
  });

  return sendEmail({
    to: toEmail,
    subject: `[Published Article] ${title} - ${journalTitle}`,
    html,
  });
}
