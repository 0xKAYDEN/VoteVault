import nodemailer from 'nodemailer';
import logger from './logger.js';

const SUPPORT_EMAIL = 'votevaultsupport@gmail.com';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  || process.env.EMAIL_HOST,
  port:   Number(process.env.SMTP_PORT  || process.env.EMAIL_PORT  || 587),
  secure: (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === 'true',
  auth: {
    user: process.env.SMTP_USER     || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html, replyTo }) => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;

  if (!user) {
    logger.info('SMTP_USER not set. Mocking email to console.');
    console.log('--- MOCK EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (replyTo) console.log(`Reply-To: ${replyTo}`);
    console.log(`Content: ${html}`);
    console.log('------------------');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"VoteVault" <${SUPPORT_EMAIL}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
  } catch (err) {
    logger.error('Error sending email:', err);
    throw new Error('Failed to send email');
  }
};
