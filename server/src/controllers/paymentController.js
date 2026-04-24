import db from '../db.js';
import logger from '../utils/logger.js';

export const verifyPayment = async (req, res) => {
  try {
    const { plan, txHash, amount } = req.body;
    const userId = req.user.id;

    if (!plan || !txHash || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if transaction hash already exists
    const [existingPayment] = await db.query(
      'SELECT * FROM payments WHERE tx_hash = ?',
      [txHash]
    );

    if (existingPayment.length > 0) {
      return res.status(400).json({ error: 'Transaction hash already used' });
    }

    // Insert payment record with pending status
    await db.query(
      `INSERT INTO payments (user_id, plan, amount, tx_hash, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [userId, plan, amount, txHash]
    );

    logger.info(`Payment submitted by user ${userId}: ${plan} plan, tx: ${txHash}`);

    res.json({
      message: 'Payment submitted successfully. We will verify and activate your plan shortly.',
      status: 'pending'
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

    // Update payment status to active and set expiration (30 days from now)
    const [result] = await db.query(
      `UPDATE payments
       SET status = 'active', activated_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
       WHERE id = ?`,
      [paymentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    logger.info(`Payment ${paymentId} activated by admin ${req.user.id}`);

    res.json({
      message: 'Payment activated successfully'
    });
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

    res.json({
      message: 'Payment rejected'
    });
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
