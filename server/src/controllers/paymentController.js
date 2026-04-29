import db from '../db.js';
import logger from '../utils/logger.js';
import { awardAchievement } from './achievementController.js';
import { sendEmail } from '../utils/email.js';
import { cache } from '../utils/cache.js';

/**
 * Invalidate a user's API rate limit cache after a plan upgrade.
 * This ensures the new plan's limits apply immediately.
 */
async function invalidateApiCache(userId) {
  try {
    const _now = new Date();
    const today = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;
    await cache.del(`api:day:${userId}:${today}`);
    await cache.del(`api:min:${userId}`);
    // Reset daily counter in DB so the new plan's limit applies from 0
    await db.query(
      `UPDATE profiles SET api_daily_used = 0, api_daily_date = ? WHERE id = ?`,
      [today, userId]
    );
    logger.info(`Cleared API rate limit cache for user ${userId} after plan upgrade`);
  } catch (err) {
    logger.warn(`Failed to clear API cache for user ${userId}:`, err.message);
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const { plan, txHash, amount } = req.body;
    const userId = req.user.id;

    if (!plan || !txHash || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate tx hash format (TRC20 = 64 hex chars)
    if (!/^[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({ error: 'Invalid transaction hash format' });
    }

    // Check if transaction hash already exists
    const [existingPayment] = await db.query(
      'SELECT * FROM payments WHERE tx_hash = ?',
      [txHash]
    );
    if (existingPayment.length > 0) {
      return res.status(400).json({ error: 'Transaction hash already used' });
    }

    // ── Auto-verify via TronScan API ──────────────────────────────────────────
    let autoActivated = false;
    try {
      const fetch = (await import('node-fetch')).default;
      const tronRes = await fetch(
        `https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`,
        { headers: { 'TRON-PRO-API-KEY': process.env.TRONSCAN_API_KEY || '' }, signal: AbortSignal.timeout(8000) }
      );
      const tronData = await tronRes.json();

      if (tronData && tronData.confirmed && tronData.contractData) {
        const cd = tronData.contractData;
        // TRC20 USDT contract on mainnet
        const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        const toAddress     = cd.to_address || cd.toAddress || '';
        const contractAddr  = cd.contract_address || cd.tokenInfo?.tokenId || '';
        const txAmount      = Number(cd.amount || cd.amount_str || 0) / 1e6; // USDT has 6 decimals
        const walletAddress = process.env.USDT_WALLET || 'TN1ZCfcKKmigD8NBCdvdAndw6GKHtKNxDU';

        const addressMatch  = toAddress.toLowerCase() === walletAddress.toLowerCase();
        const contractMatch = contractAddr.toLowerCase() === USDT_CONTRACT.toLowerCase();
        const amountMatch   = Math.abs(txAmount - Number(amount)) < 0.01; // allow 1 cent tolerance

        if (addressMatch && contractMatch && amountMatch) {
          const days = plan === 'user_premium_yearly' ? 365 : 30;
          await db.query(
            `INSERT INTO payments (user_id, plan, amount, tx_hash, status, created_at, activated_at, expires_at)
             VALUES (?, ?, ?, ?, 'active', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))`,
            [userId, plan, amount, txHash, days]
          );
          await awardAchievement(userId, 20);
          // Auto-grant verified badge on Starter+ server plans
          const serverPlans = ['starter', 'pro', 'enterprise'];
          if (serverPlans.includes(plan)) {
            await db.query(
              `UPDATE servers SET is_verified = TRUE WHERE owner_id = ? AND is_verified = FALSE`,
              [userId]
            );
          }
          // Send activation email
          const [userRows] = await db.query(
            'SELECT u.email, pr.display_name, pr.username FROM users u LEFT JOIN profiles pr ON u.id = pr.id WHERE u.id = ?',
            [userId]
          );
          if (userRows.length > 0) {
            const name = userRows[0].display_name || userRows[0].username || 'there';
            const expiryDate = new Date(Date.now() + days * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            sendEmail({
              to: userRows[0].email,
              subject: '🎉 Your VoteVault Premium is now active!',
              html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:12px;">
                <h1 style="color:#ef4444;">Premium Activated!</h1>
                <p>Hey ${name}, your <strong>${plan.replace(/_/g, ' ')}</strong> subscription is active until <strong>${expiryDate}</strong>.</p>
                <a href="${process.env.FRONTEND_URL}/dashboard/premium" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View Premium</a>
              </div>`,
            }).catch(() => {});
          }
          autoActivated = true;
          // Invalidate API cache so new plan limits apply immediately
          await invalidateApiCache(userId);
          logger.info(`Payment auto-activated for user ${userId}: ${plan}, tx: ${txHash}`);
          return res.json({ message: 'Payment verified and activated automatically!', status: 'active', autoActivated: true });
        }
      }
    } catch (tronErr) {
      logger.warn('TronScan auto-verify failed, falling back to manual review:', tronErr.message);
    }

    // Fallback: store as pending for manual admin review
    await db.query(
      `INSERT INTO payments (user_id, plan, amount, tx_hash, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [userId, plan, amount, txHash]
    );

    logger.info(`Payment submitted (pending) by user ${userId}: ${plan}, tx: ${txHash}`);
    res.json({
      message: 'Payment submitted. We will verify and activate your plan within 10 minutes.',
      status: 'pending',
      autoActivated: false,
    });
  } catch (error) {
    logger.error('Error submitting payment:', error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
};

export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `SELECT id, plan, amount, tx_hash, status, created_at, activated_at, expires_at
       FROM payments
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ payments: result });
  } catch (error) {
    logger.error('Error fetching user payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const getActiveSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `SELECT plan, expires_at
       FROM payments
       WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.length === 0) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: result[0] });
  } catch (error) {
    logger.error('Error fetching active subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

// Admin only - verify and activate payment
export const activatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Get payment to determine plan duration
    const [payments] = await db.query('SELECT plan FROM payments WHERE id = ?', [paymentId]);
    if (payments.length === 0) return res.status(404).json({ error: 'Payment not found' });

    const plan = payments[0].plan;
    // Yearly plans get 365 days, everything else 30 days
    const days = plan === 'user_premium_yearly' ? 365 : 30;

    const [result] = await db.query(
      `UPDATE payments
       SET status = 'active', activated_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL ? DAY)
       WHERE id = ?`,
      [days, paymentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    logger.info(`Payment ${paymentId} activated by admin ${req.user.id} (${days} days)`);

    // Award "Premium Member" achievement (id: 20) and send email notification
    const [payment] = await db.query(
      'SELECT p.user_id, u.email, pr.display_name, pr.username FROM payments p JOIN users u ON p.user_id = u.id LEFT JOIN profiles pr ON p.user_id = pr.id WHERE p.id = ?',
      [paymentId]
    );
    if (payment.length > 0) {
      await awardAchievement(payment[0].user_id, 20);

      // ── Invalidate API rate limit cache so new plan limits apply immediately ──
      await invalidateApiCache(payment[0].user_id);

      // Auto-grant verified badge on Starter+ server plans (Section 5.5)
      const serverPlans = ['starter', 'pro', 'enterprise'];
      if (serverPlans.includes(plan)) {
        await db.query(
          `UPDATE servers SET is_verified = TRUE WHERE owner_id = ? AND is_verified = FALSE`,
          [payment[0].user_id]
        );
        logger.info(`Auto-verified servers for user ${payment[0].user_id} on plan ${plan}`);
      }

      // Send activation email
      const name = payment[0].display_name || payment[0].username || 'there';
      const expiryDate = new Date(Date.now() + days * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      await sendEmail({
        to: payment[0].email,
        subject: '🎉 Your VoteVault Premium is now active!',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:12px;">
            <h1 style="color:#ef4444;margin-bottom:8px;">Premium Activated!</h1>
            <p>Hey ${name},</p>
            <p>Your <strong>${plan.replace(/_/g, ' ')}</strong> subscription is now active and expires on <strong>${expiryDate}</strong>.</p>
            <p>You now have access to all premium features including custom profile themes, unlimited friends, double XP, vote streak bonuses, and more.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard/premium" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View Premium Features</a>
            <p style="color:#666;margin-top:24px;font-size:12px;">VoteVault — The premium server ranking platform</p>
          </div>
        `,
      }).catch(err => logger.warn('Failed to send activation email:', err.message));
    }

    res.json({ message: 'Payment activated successfully' });
  } catch (error) {
    logger.error('Error activating payment:', error);
    res.status(500).json({ error: 'Failed to activate payment' });
  }
};

// Admin only - reject payment
export const rejectPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const [result] = await db.query(
      `UPDATE payments
       SET status = 'rejected', rejection_reason = ?
       WHERE id = ?`,
      [reason, paymentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    logger.info(`Payment ${paymentId} rejected by admin ${req.user.id}`);

    // Notify user of rejection
    const [payment] = await db.query(
      'SELECT p.user_id, u.email, pr.display_name, pr.username FROM payments p JOIN users u ON p.user_id = u.id LEFT JOIN profiles pr ON p.user_id = pr.id WHERE p.id = ?',
      [paymentId]
    );
    if (payment.length > 0) {
      const name = payment[0].display_name || payment[0].username || 'there';
      await sendEmail({
        to: payment[0].email,
        subject: 'VoteVault Payment Update',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:12px;">
            <h2 style="color:#ef4444;">Payment Not Verified</h2>
            <p>Hey ${name},</p>
            <p>Unfortunately we could not verify your recent payment.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>Please contact support if you believe this is an error.</p>
            <a href="${process.env.FRONTEND_URL}/contact" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">Contact Support</a>
          </div>
        `,
      }).catch(err => logger.warn('Failed to send rejection email:', err.message));
    }

    res.json({ message: 'Payment rejected' });
  } catch (error) {
    logger.error('Error rejecting payment:', error);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
};

// Admin only - get all pending payments
export const getPendingPayments = async (req, res) => {
  try {
    const [result] = await db.query(
      `SELECT p.*, pr.username, u.email
       FROM payments p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at DESC`
    );

    res.json(result);
  } catch (error) {
    logger.error('Error fetching pending payments:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
};

// Admin only - grant a subscription directly to a user (no payment required)
export const grantSubscription = async (req, res) => {
  try {
    const { userId, plan, days } = req.body;
    const adminId = req.user.id;

    if (!userId || !plan) {
      return res.status(400).json({ error: 'userId and plan are required' });
    }

    const validPlans = ['starter', 'pro', 'enterprise', 'user_premium_monthly', 'user_premium_yearly'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const grantDays = Number(days) || (plan === 'user_premium_yearly' ? 365 : 30);

    // Check user exists
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    // Insert as an admin-granted active payment (no tx_hash)
    await db.query(
      `INSERT INTO payments (user_id, plan, amount, tx_hash, status, created_at, activated_at, expires_at)
       VALUES (?, ?, 0, ?, 'active', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [userId, plan, `admin_grant_${Date.now()}`, grantDays]
    );

    // Award achievement
    await awardAchievement(userId, 20);

    // Invalidate API cache so new plan limits apply immediately
    await invalidateApiCache(userId);

    // Auto-verify servers for server plans
    const serverPlans = ['starter', 'pro', 'enterprise'];
    if (serverPlans.includes(plan)) {
      await db.query(
        `UPDATE servers SET is_verified = TRUE WHERE owner_id = ? AND is_verified = FALSE`,
        [userId]
      );
    }

    // Send notification email
    const [userRows] = await db.query(
      'SELECT u.email, pr.display_name, pr.username FROM users u LEFT JOIN profiles pr ON u.id = pr.id WHERE u.id = ?',
      [userId]
    );
    if (userRows.length > 0) {
      const name = userRows[0].display_name || userRows[0].username || 'there';
      const expiryDate = new Date(Date.now() + grantDays * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      sendEmail({
        to: userRows[0].email,
        subject: '🎉 Your VoteVault subscription has been activated!',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:12px;">
            <h1 style="color:#ef4444;">Subscription Granted!</h1>
            <p>Hey ${name},</p>
            <p>An admin has granted you a <strong>${plan.replace(/_/g, ' ')}</strong> subscription, active until <strong>${expiryDate}</strong>.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard/premium" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View Premium</a>
          </div>
        `,
      }).catch(() => {});
    }

    logger.info(`Admin ${adminId} granted ${plan} (${grantDays} days) to user ${userId}`);
    res.json({ message: `${plan} subscription granted for ${grantDays} days` });
  } catch (error) {
    logger.error('Error granting subscription:', error);
    res.status(500).json({ error: 'Failed to grant subscription' });
  }
};

// Admin only - get/set payment system status (kill switch)
export const getPaymentStatus = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT setting_value FROM app_settings WHERE setting_key = 'payments_enabled' LIMIT 1`
    );
    const enabled = rows.length === 0 || rows[0].setting_value !== 'false';
    res.json({ enabled });
  } catch (error) {
    // If table doesn't exist yet, payments are enabled by default
    res.json({ enabled: true });
  }
};

export const setPaymentStatus = async (req, res) => {
  try {
    const { enabled } = req.body;
    const adminId = req.user.id;

    await db.query(
      `INSERT INTO app_settings (setting_key, setting_value, updated_by)
       VALUES ('payments_enabled', ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?, updated_at = NOW()`,
      [String(enabled), adminId, String(enabled), adminId]
    );

    logger.info(`Admin ${adminId} set payments_enabled = ${enabled}`);
    res.json({ message: `Payments ${enabled ? 'enabled' : 'disabled'}`, enabled });
  } catch (error) {
    logger.error('Error setting payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

// Public — check if payments are enabled (used by Payment page)
export const checkPaymentsEnabled = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT setting_value FROM app_settings WHERE setting_key = 'payments_enabled' LIMIT 1`
    );
    const enabled = rows.length === 0 || rows[0].setting_value !== 'false';
    res.json({ enabled });
  } catch {
    res.json({ enabled: true });
  }
};
