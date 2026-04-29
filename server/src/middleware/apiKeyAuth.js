import pool from '../db.js';
import { cache } from '../utils/cache.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Per-plan API rate limits — fallback defaults if DB is unavailable.
 * Loaded dynamically from api_plan_config table with Redis cache.
 */
export const PLAN_LIMITS_DEFAULT = {
  free:       { daily: 500,    perMinute: 10   },
  starter:    { daily: 5000,   perMinute: 60   },
  pro:        { daily: 50000,  perMinute: 300  },
  enterprise: { daily: null,   perMinute: 1000 },
};

// Keep a module-level reference so we don't hit DB on every request
let _planLimitsCache = null;
let _planLimitsCacheExpiry = 0;

/**
 * Load plan limits from DB (with Redis cache, 5 min TTL).
 * Falls back to hardcoded defaults if DB/Redis is unavailable.
 */
async function getPlanLimits() {
  const now = Date.now();
  // In-memory cache: avoid Redis round-trip on every request
  if (_planLimitsCache && now < _planLimitsCacheExpiry) {
    return _planLimitsCache;
  }

  try {
    const cached = await cache.get('plan_config');
    if (cached) {
      _planLimitsCache = cached;
      _planLimitsCacheExpiry = now + 5 * 60 * 1000;
      return cached;
    }

    const [rows] = await pool.query(
      'SELECT plan_name, daily_limit, per_minute FROM api_plan_config WHERE is_active = 1'
    );

    if (rows.length > 0) {
      const config = {};
      rows.forEach(r => {
        config[r.plan_name] = { daily: r.daily_limit, perMinute: r.per_minute };
      });
      await cache.set('plan_config', config, 300); // 5 min TTL
      _planLimitsCache = config;
      _planLimitsCacheExpiry = now + 5 * 60 * 1000;
      return config;
    }
  } catch (err) {
    logger.warn('Failed to load plan config from DB, using defaults:', err.message);
  }

  return PLAN_LIMITS_DEFAULT;
}

// Backwards-compatible export
export const PLAN_LIMITS = PLAN_LIMITS_DEFAULT;

/**
 * Resolve plan name from a raw subscription plan string.
 */
export function resolvePlan(subscriptionPlan) {
  if (!subscriptionPlan) return 'free';
  if (subscriptionPlan.includes('enterprise')) return 'enterprise';
  if (subscriptionPlan.includes('pro'))        return 'pro';
  if (subscriptionPlan.includes('starter'))    return 'starter';
  return 'free';
}

/**
 * Middleware: authenticate an API key from the Authorization header
 * and enforce per-USER (not per-key) rate limits.
 *
 * All keys owned by the same user share one daily quota.
 * Usage: Authorization: Bearer vv_<key>
 */
export const apiKeyAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  if (!authHeader) {
    return res.status(401).json({ error: 'API key required', hint: 'Pass your key as: Authorization: Bearer <key>' });
  }

  const rawKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!rawKey.startsWith('vv_')) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }

  const keyHash   = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 10);

  try {
    // ── Look up the key + owner subscription ──────────────────────────────
    const [keys] = await pool.query(
      `SELECT ak.id, ak.owner_id, ak.server_id, ak.revoked,
              p.plan AS subscription_plan
       FROM api_keys ak
       JOIN users u ON ak.owner_id = u.id
       LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'active' AND p.expires_at > NOW()
       WHERE ak.key_hash = ? AND ak.key_prefix = ? AND ak.revoked = FALSE
       ORDER BY p.expires_at DESC
       LIMIT 1`,
      [keyHash, keyPrefix]
    );

    if (!keys.length) {
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }

    const key    = keys[0];
    const plan   = resolvePlan(key.subscription_plan);
    const planLimits = await getPlanLimits();
    const limits = planLimits[plan] || PLAN_LIMITS_DEFAULT[plan] || PLAN_LIMITS_DEFAULT.free;
    // Use local date so the daily quota resets at local midnight, not UTC midnight
    const _now   = new Date();
    const today  = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;

    // ── Per-minute rate limit (per user, Redis only) ───────────────────────
    const minKey   = `api:min:${key.owner_id}`;
    const minCount = parseInt(await cache.get(minKey) || '0');

    if (minCount >= limits.perMinute) {
      return res.status(429).json({
        error: 'Rate limit exceeded (per minute)',
        limit: limits.perMinute,
        plan,
        retryAfter: 60,
      });
    }

    // ── Daily rate limit (per user, Redis + DB) ────────────────────────────
    const dayKey   = `api:day:${key.owner_id}:${today}`;
    let   dayCount = parseInt(await cache.get(dayKey) || '-1');

    // Cache miss — load from DB
    if (dayCount === -1) {
      const [rows] = await pool.query(
        'SELECT api_daily_used, api_daily_date FROM profiles WHERE id = ?',
        [key.owner_id]
      );
      if (rows.length && rows[0].api_daily_date === today) {
        dayCount = rows[0].api_daily_used;
      } else {
        dayCount = 0;
      }
      // Warm the cache (TTL = seconds until midnight + 60s buffer)
      const ttl = Math.ceil((new Date().setHours(24, 0, 0, 0) - Date.now()) / 1000) + 60;
      await cache.set(dayKey, dayCount, ttl);
    }

    if (limits.daily !== null && dayCount >= limits.daily) {
      const secondsUntilMidnight = Math.ceil(
        (new Date().setHours(24, 0, 0, 0) - Date.now()) / 1000
      );
      return res.status(429).json({
        error: 'Daily rate limit exceeded',
        limit: limits.daily,
        used: dayCount,
        remaining: 0,
        plan,
        retryAfter: secondsUntilMidnight,
        resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      });
    }

    // ── Increment counters ─────────────────────────────────────────────────
    const newDayCount = dayCount + 1;
    const newMinCount = minCount + 1;

    // Redis: daily counter
    const dayTtl = Math.ceil((new Date().setHours(24, 0, 0, 0) - Date.now()) / 1000) + 60;
    await cache.set(dayKey, newDayCount, dayTtl);

    // Redis: per-minute counter
    const minTtl = minCount === 0 ? 60 : (await cache.ttl(minKey) || 60);
    await cache.set(minKey, newMinCount, minTtl > 0 ? minTtl : 60);

    // ── Set response headers ───────────────────────────────────────────────
    if (limits.daily !== null) {
      const remaining = Math.max(0, limits.daily - newDayCount);
      res.setHeader('X-RateLimit-Daily-Limit',     limits.daily);
      res.setHeader('X-RateLimit-Daily-Remaining', remaining);
      res.setHeader('X-RateLimit-Daily-Used',      newDayCount);
    } else {
      res.setHeader('X-RateLimit-Daily-Limit', 'unlimited');
    }
    res.setHeader('X-RateLimit-Minute-Limit',     limits.perMinute);
    res.setHeader('X-RateLimit-Minute-Remaining', Math.max(0, limits.perMinute - newMinCount));
    res.setHeader('X-API-Plan', plan);

    // ── Persist to DB (async, fire-and-forget) ─────────────────────────────
    pool.query(
      `UPDATE profiles SET
         api_daily_used     = IF(api_daily_date = ?, api_daily_used + 1, 1),
         api_daily_date     = ?,
         api_total_requests = api_total_requests + 1
       WHERE id = ?`,
      [today, today, key.owner_id]
    ).catch(() => {});

    // Upsert into daily log for activity chart
    pool.query(
      `INSERT INTO api_request_log (user_id, log_date, request_count)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE request_count = request_count + 1`,
      [key.owner_id, today]
    ).catch(() => {});

    // Update per-key last_used + counters
    pool.query(
      `UPDATE api_keys SET
         last_used_at       = NOW(),
         total_requests     = total_requests + 1,
         requests_today     = IF(requests_today_date = ?, requests_today + 1, 1),
         requests_today_date = ?
       WHERE id = ?`,
      [today, today, key.id]
    ).catch(() => {});

    // ── Attach to request ──────────────────────────────────────────────────
    req.apiKey = {
      id:        key.id,
      ownerId:   key.owner_id,
      serverId:  key.server_id,
      plan,
      limits,
      dailyUsed: newDayCount,
      dailyRemaining: limits.daily !== null ? Math.max(0, limits.daily - newDayCount) : null,
    };

    next();
  } catch (err) {
    logger.error('API key auth error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
};
