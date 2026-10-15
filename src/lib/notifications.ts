import prisma from './prisma';

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

    // Also dispatch email simulation
    await sendTransactionalEmail({
      toUserId: userId,
      subject: title,
      htmlBody: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0c1a2d; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">NextGen Research and Innovation Press</h2>
          <p style="font-size: 16px; color: #1e293b;"><strong>${title}</strong></p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">${message}</p>
          ${linkUrl ? `<p style="margin-top: 24px;"><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${linkUrl}" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View in Portal</a></p>` : ''}
          <hr style="margin-top: 32px; border: none; border-top: 1px solid #cbd5e1;" />
          <p style="font-size: 12px; color: #94a3b8;">NextGen Research and Innovation Press • Scholarly Editorial Office • Automated Notification</p>
        </div>
      `,
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
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

  // If external SMTP is configured, we can dispatch via nodemailer, or log to console
  console.log(`[EMAIL DISPATCH] To: ${recipientEmail} | Subject: "${subject}"`);
  return { success: true, deliveredAt: new Date().toISOString() };
}
