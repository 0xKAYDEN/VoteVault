import express from 'express';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate limit: 5 contact form submissions per hour per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Return JSON so the frontend can parse it
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many contact form submissions. Please try again later.' });
  },
});

router.post('/', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  if (message.length > 5000) {
    return res.status(400).json({ message: 'Message too long (max 5000 characters)' });
  }

  try {
    await sendEmail({
      to: 'votevaultsupport@gmail.com',
      subject: `[Contact Form] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f0f0f;color:#fff;border-radius:12px;">
          <h2 style="color:#ef4444;margin-bottom:16px;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#aaa;width:100px;">From:</td><td style="padding:8px 0;">${name} &lt;${email}&gt;</td></tr>
            <tr><td style="padding:8px 0;color:#aaa;">Subject:</td><td style="padding:8px 0;">${subject}</td></tr>
          </table>
          <hr style="border-color:#333;margin:16px 0;" />
          <p style="white-space:pre-wrap;line-height:1.6;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <hr style="border-color:#333;margin:16px 0;" />
          <p style="color:#666;font-size:12px;">Reply directly to this email to respond to ${email}</p>
        </div>
      `,
      replyTo: email,
    });

    // Send confirmation to the user
    await sendEmail({
      to: email,
      subject: 'We received your message — VoteVault',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f0f0f;color:#fff;border-radius:12px;">
          <h2 style="color:#ef4444;">Thanks for reaching out!</h2>
          <p>Hi ${name},</p>
          <p>We received your message and will get back to you within 24 hours.</p>
          <p style="color:#aaa;font-size:12px;margin-top:24px;">VoteVault Support — votevaultsupport@gmail.com</p>
        </div>
      `,
    }).catch(() => {}); // Don't fail if confirmation email fails

    logger.info(`Contact form submitted by ${email}: ${subject}`);
    res.json({ message: 'Message sent successfully' });
  } catch (err) {
    logger.error('Contact form error:', err);
    res.status(500).json({ message: 'Failed to send message. Please try again or email us directly.' });
  }
});

export default router;
