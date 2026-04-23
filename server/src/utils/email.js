import nodemailer from 'nodemailer';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER) {
    logger.info('EMAIL_USER not set. Mocking email to console.');
    console.log('--- MOCK EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${html}`);
    console.log('------------------');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Conquer Toplist" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    logger.error('Error sending email:', err);
    throw new Error('Failed to send email');
  }
};
