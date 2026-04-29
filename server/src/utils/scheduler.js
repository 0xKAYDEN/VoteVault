import db from '../db.js';
import { sendEmail } from './email.js';
import logger from './logger.js';

/**
 * Send expiry warning emails to users whose premium expires in ~7 days.
 * Runs every 6 hours.
 */
export const sendExpiryWarnings = async () => {
  try {
    // Guard: check if expiry_warned column exists before using it
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'expiry_warned'`
    );

    let query;
    if (cols.length > 0) {
      query = `SELECT p.user_id, p.plan, p.expires_at, u.email, pr.display_name, pr.username
               FROM payments p
               JOIN users u ON p.user_id = u.id
               LEFT JOIN profiles pr ON p.user_id = pr.id
               WHERE p.status = 'active'
                 AND p.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
                 AND p.expiry_warned = FALSE`;
    } else {
      // Column doesn't exist yet — add it and skip this run
      await db.query('ALTER TABLE payments ADD COLUMN expiry_warned TINYINT(1) NOT NULL DEFAULT 0');
      logger.info('Scheduler: added expiry_warned column to payments table');
      return;
    }

    const [expiring] = await db.query(query);

    for (const row of expiring) {
      const name = row.display_name || row.username || 'there';
      const expiryDate = new Date(row.expires_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      await sendEmail({
        to: row.email,
        subject: '⚠️ Your VoteVault Premium expires soon',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:12px;">
            <h2 style="color:#f97316;">Premium Expiring Soon</h2>
            <p>Hey ${name},</p>
            <p>Your VoteVault Premium subscription expires on <strong>${expiryDate}</strong>.</p>
            <p>Renew now to keep your premium badge, profile themes, unlimited friends, and all other benefits.</p>
            <a href="${process.env.FRONTEND_URL}/pricing"
               style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
              Renew Premium
            </a>
          </div>
        `,
      }).catch(err => logger.warn(`Failed to send expiry warning to ${row.email}:`, err.message));

      await db.query(
        'UPDATE payments SET expiry_warned = TRUE WHERE user_id = ? AND status = "active"',
        [row.user_id]
      );
    }

    if (expiring.length > 0) {
      logger.info(`Scheduler: sent ${expiring.length} expiry warning email(s)`);
    }
  } catch (err) {
    logger.error('sendExpiryWarnings error:', err);
  }
};

/**
 * Start all scheduled jobs.
 */
export const startScheduler = () => {
  // Run expiry warnings every 6 hours
  setInterval(sendExpiryWarnings, 6 * 60 * 60 * 1000);
  sendExpiryWarnings(); // Run immediately on startup

  logger.info('Scheduler started');
};
