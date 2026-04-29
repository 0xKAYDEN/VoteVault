import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import pool from '../db.js';
import { cache } from '../utils/cache.js';
import { PLAN_LIMITS, resolvePlan } from '../middleware/apiKeyAuth.js';
import logger from '../utils/logger.js';

// ── GET /api/api-keys ─────────────────────────────────────────────────────────
export const getApiKeys = async (req, res) => {
  const owner_id = req.user.id;
  try {
    // Keys
    const [rows] = await pool.query(
      `SELECT id, public_id, owner_id, server_id, key_prefix, label,
              last_used_at, revoked, created_at,
              total_requests, requests_today, requests_today_date
       FROM api_keys WHERE owner_id = ? ORDER BY created_at DESC`,
      [owner_id]
    );

    // User quota (shared across all keys)
    const [profile] = await pool.query(
      `SELECT api_daily_used, api_daily_date, api_total_requests FROM profiles WHERE id = ?`,
      [owner_id]
    );

    // Active subscription plan
    const [sub] = await pool.query(
      `SELECT plan FROM payments WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [owner_id]
    );

    const plan   = resolvePlan(sub[0]?.plan);
    const limits = PLAN_LIMITS[plan];
    const _now   = new Date();
    const today  = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;

    // Try Redis first for live daily count
    const dayKey   = `api:day:${owner_id}:${today}`;
    let   dailyUsed = parseInt(await cache.get(dayKey) || '-1');
    if (dailyUsed === -1) {
      // Fall back to DB
      const p = profile[0];
      dailyUsed = (p && p.api_daily_date === today) ? (p.api_daily_used || 0) : 0;
    }

    const dailyRemaining = limits.daily !== null
      ? Math.max(0, limits.daily - dailyUsed)
      : null;

    res.json({
      keys: rows,
      quota: {
        plan,
        limits,
        dailyUsed,
        dailyRemaining,
        totalRequests: profile[0]?.api_total_requests || 0,
        resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      },
    });
  } catch (err) {
    logger.error('Error fetching API keys:', err);
    res.status(500).json({ message: 'Error fetching API keys' });
  }
};

// ── POST /api/api-keys ────────────────────────────────────────────────────────
export const createApiKey = async (req, res) => {
  const { server_id, label } = req.body;
  const owner_id = req.user.id;

  try {
    const rawKey   = `vv_${crypto.randomBytes(16).toString('hex')}`;
    const keyPrefix = rawKey.slice(0, 10);
    const keyHash   = crypto.createHash('sha256').update(rawKey).digest('hex');
    const public_id = uuidv4();

    await pool.query(
      `INSERT INTO api_keys (public_id, owner_id, server_id, key_prefix, key_hash, label)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [public_id, owner_id, server_id || null, keyPrefix, keyHash, label || null]
    );

    res.status(201).json({
      key: rawKey,
      key_prefix: keyPrefix,
      message: 'API key created. Save this key — it will not be shown again.',
    });
  } catch (err) {
    logger.error('Error creating API key:', err);
    res.status(500).json({ message: 'Error creating API key' });
  }
};

// ── POST /api/api-keys/:id/revoke ─────────────────────────────────────────────
export const revokeApiKey = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;

  try {
    await pool.query(
      'UPDATE api_keys SET revoked = true WHERE id = ? AND owner_id = ?',
      [id, owner_id]
    );
    res.json({ message: 'API key revoked' });
  } catch (err) {
    logger.error('Error revoking API key:', err);
    res.status(500).json({ message: 'Error revoking API key' });
  }
};

// ── GET /api/api-keys/activity ────────────────────────────────────────────────
// Returns daily request counts for a given year (defaults to current year)
export const getApiActivity = async (req, res) => {
  const owner_id = req.user.id;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  // Clamp to reasonable range
  const currentYear = new Date().getFullYear();
  const safeYear = Math.max(2024, Math.min(currentYear, year));

  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(log_date, '%Y-%m-%d') AS log_date, request_count
       FROM api_request_log
       WHERE user_id = ?
         AND YEAR(log_date) = ?
       ORDER BY log_date ASC`,
      [owner_id, safeYear]
    );

    // Also return the list of years that have data (for the year selector)
    const [years] = await pool.query(
      `SELECT DISTINCT YEAR(log_date) AS year
       FROM api_request_log
       WHERE user_id = ?
       ORDER BY year DESC`,
      [owner_id]
    );

    // Always include current year even if no data yet
    const yearList = years.map((r) => r.year);
    if (!yearList.includes(currentYear)) yearList.unshift(currentYear);

    res.json({ data: rows, year: safeYear, years: yearList });
  } catch (err) {
    logger.error('Error fetching API activity:', err);
    res.status(500).json({ message: 'Error fetching activity' });
  }
};
