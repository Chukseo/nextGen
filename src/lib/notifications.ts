import prisma from './prisma';
import { sendEmail, renderScholarlyEmail } from './email';

export async function createNotification({
  userId,
  type,
  title,
  message,
  linkUrl,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl,
      },
    });

    // Lookup user to get name & email
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (recipient?.email) {
      // Determine badge and color based on notification type
      let badgeText = 'Scholarly Notification';
      let badgeColor = '#2563eb';

      if (type.includes('SUBMISSION_CONFIRMED')) {
        badgeText = 'Manuscript Logged';
        badgeColor = '#4f46e5';
      } else if (type.includes('NEW_SUBMISSION') || type.includes('EDITOR')) {
        badgeText = 'Editorial Desk Action';
        badgeColor = '#d97706';
      } else if (type.includes('DECISION')) {
        badgeText = 'Editorial Determination';
        badgeColor = title.toLowerCase().includes('accept') ? '#059669' : '#ea580c';
      } else if (type.includes('REVIEWER') || type.includes('INVITATION')) {
        badgeText = 'Peer Review Assignment';
        badgeColor = '#0284c7';
      } else if (type.includes('PUBLISHED')) {
        badgeText = 'Article Published & DOI Active';
        badgeColor = '#0d9488';
      } else if (type.includes('REVISION')) {
        badgeText = 'Manuscript Revision Received';
        badgeColor = '#ea580c';
      }

      const htmlBody = renderScholarlyEmail({
        title,
        preheader: message.slice(0, 100),
        badgeText,
        badgeColor,
        recipientName: recipient.name || 'Scholar',
        introParagraphs: [message],
        actionButton: linkUrl
          ? {
              text: 'Open in Portal',
              url: linkUrl,
            }
          : undefined,
      });

      await sendEmail({
        to: recipient.email,
        subject: title,
        html: htmlBody,
      });
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification or dispatch email:', error);
  }
}

export async function sendTransactionalEmail({
  toUserId,
  toEmail,
  subject,
  htmlBody,
}: {
  toUserId?: string;
  toEmail?: string;
  subject: string;
  htmlBody: string;
}) {
  let recipientEmail = toEmail;

  if (toUserId && !recipientEmail) {
    const user = await prisma.user.findUnique({ where: { id: toUserId } });
    if (user) {
      recipientEmail = user.email;
    }
  }

  if (!recipientEmail) {
    console.warn('[EMAIL WARNING] Cannot send email: No recipient email found.');
    return { success: false, error: 'Recipient email missing' };
  }

  return sendEmail({
    to: recipientEmail,
    subject,
    html: htmlBody,
  });
}
