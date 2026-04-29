import db from '../db.js';

/**
 * Middleware to check if the authenticated user has an active premium subscription.
 * Attaches `req.isPremium` and `req.premiumPlan` for use in controllers.
 */
const premiumOnly = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [rows] = await db.query(
      `SELECT plan, expires_at FROM payments
       WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Premium subscription required', requiresPremium: true });
    }

    req.isPremium = true;
    req.premiumPlan = rows[0].plan;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

/**
 * Soft check — attaches isPremium without blocking the request.
 * Use this when premium unlocks extra data but the endpoint is still accessible to all.
 */
export const attachPremiumStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    req.isPremium = false;
    req.premiumPlan = null;

    if (userId) {
      const [rows] = await db.query(
        `SELECT plan FROM payments
         WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
         ORDER BY expires_at DESC LIMIT 1`,
        [userId]
      );
      if (rows.length > 0) {
        req.isPremium = true;
        req.premiumPlan = rows[0].plan;
      }
    }
    next();
  } catch {
    req.isPremium = false;
    next();
  }
};

export default premiumOnly;
