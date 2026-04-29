import pool from '../db.js';
import logger from '../utils/logger.js';

/**
 * GET /api/analytics/realtime
 * Returns live counts: total votes today, active servers, votes last hour, etc.
 */
export const getRealtimeStats = async (req, res) => {
  const owner_id = req.user?.id;
  try {
    const ownerFilter = owner_id ? 'AND s.owner_id = ?' : '';
    const ownerParams = owner_id ? [owner_id] : [];

    // Votes in the last hour for this owner's servers
    const [lastHour] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM votes v
       JOIN servers s ON v.server_id = s.id
       WHERE v.voted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
       ${ownerFilter}`,
      ownerParams
    );

    // Votes in the last 24h
    const [last24h] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM votes v
       JOIN servers s ON v.server_id = s.id
       WHERE v.voted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ${ownerFilter}`,
      ownerParams
    );

    // Votes in the last 7 days
    const [last7d] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM votes v
       JOIN servers s ON v.server_id = s.id
       WHERE v.voted_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
       ${ownerFilter}`,
      ownerParams
    );

    // Active servers (voted in last 24h)
    const [activeServers] = await pool.query(
      `SELECT COUNT(DISTINCT v.server_id) AS count
       FROM votes v
       JOIN servers s ON v.server_id = s.id
       WHERE v.voted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ${ownerFilter}`,
      ownerParams
    );

    // Total all-time votes
    const [allTime] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM votes v
       JOIN servers s ON v.server_id = s.id
       WHERE 1=1
       ${ownerFilter}`,
      ownerParams
    );

    // Suspicious votes in last 24h
    const [suspicious] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM votes v
       JOIN servers s ON v.server_id = s.id
       WHERE v.voted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
       AND v.is_suspicious = 1
       ${ownerFilter}`,
      ownerParams
    );

    // Unique voters in last 24h
    const [uniqueVoters] = await pool.query(
      `SELECT COUNT(DISTINCT v.voter_user_id) AS count
       FROM votes v
       JOIN servers s ON v.server_id = s.id
       WHERE v.voted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ${ownerFilter}`,
      ownerParams
    );

    res.json({
      timestamp: new Date().toISOString(),
      votesLastHour: lastHour[0].count,
      votesLast24h: last24h[0].count,
      votesLast7d: last7d[0].count,
      allTimeVotes: allTime[0].count,
      activeServers: activeServers[0].count,
      suspiciousLast24h: suspicious[0].count,
      uniqueVotersLast24h: uniqueVoters[0].count,
    });
  } catch (err) {
    logger.error('Error fetching realtime stats:', err);
    res.status(500).json({ message: 'Error fetching realtime stats' });
  }
};

/**
 * GET /api/analytics/trends
 * Returns aggregated daily/weekly/monthly vote counts for historical analysis.
 * Supports up to 2 years of data. Query params: server_id, from, to, granularity (day|week|month)
 */
export const getTrends = async (req, res) => {
  const owner_id = req.user?.id;
  const { server_id, from, to, granularity = 'day' } = req.query;

  if (!owner_id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let dateFormat;
    switch (granularity) {
      case 'week':
        dateFormat = '%x-W%v'; // ISO year + week number
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    let query = `
      SELECT
        DATE_FORMAT(v.voted_at, ?) AS period,
        COUNT(*) AS votes,
        COUNT(DISTINCT v.voter_user_id) AS unique_voters,
        SUM(CASE WHEN v.is_suspicious = 1 THEN 1 ELSE 0 END) AS suspicious_votes,
        ROUND(COUNT(*) * 100.0 / NULLIF(COUNT(*), 0) - SUM(CASE WHEN v.is_suspicious = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS conversion_rate
      FROM votes v
      JOIN servers s ON v.server_id = s.id
      WHERE s.owner_id = ?
    `;
    const params = [dateFormat, owner_id];

    if (server_id && server_id !== 'all') {
      query += ' AND v.server_id = ?';
      params.push(server_id);
    }

    // Default range: last 30 days. Max: 2 years back
    const maxFrom = new Date();
    maxFrom.setFullYear(maxFrom.getFullYear() - 2);

    let fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    if (fromDate < maxFrom) fromDate = maxFrom;

    query += ' AND v.voted_at >= ?';
    params.push(fromDate.toISOString().replace('T', ' ').slice(0, 19));

    if (to) {
      query += ' AND v.voted_at <= ?';
      params.push(to.replace('T', ' ').replace('Z', ''));
    }

    query += ' GROUP BY period ORDER BY period ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    logger.error('Error fetching trends:', err);
    res.status(500).json({ message: 'Error fetching trends' });
  }
};

/**
 * GET /api/analytics/geo
 * Returns vote counts grouped by country and city (top 20).
 */
export const getGeoDistribution = async (req, res) => {
  const owner_id = req.user?.id;
  const { server_id, from, to } = req.query;

  if (!owner_id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let query = `
      SELECT
        COALESCE(v.voter_country, 'Unknown') AS country,
        COUNT(*) AS votes,
        COUNT(DISTINCT v.voter_user_id) AS unique_voters
      FROM votes v
      JOIN servers s ON v.server_id = s.id
      WHERE s.owner_id = ?
    `;
    const params = [owner_id];

    if (server_id && server_id !== 'all') {
      query += ' AND v.server_id = ?';
      params.push(server_id);
    }
    if (from) {
      query += ' AND v.voted_at >= ?';
      params.push(from.replace('T', ' ').replace('Z', ''));
    }
    if (to) {
      query += ' AND v.voted_at <= ?';
      params.push(to.replace('T', ' ').replace('Z', ''));
    }

    query += ' GROUP BY country ORDER BY votes DESC LIMIT 20';

    const [rows] = await pool.query(query, params);

    // Also get total for percentage calculation
    const total = rows.reduce((s, r) => s + r.votes, 0);
    const result = rows.map(r => ({
      ...r,
      percentage: total > 0 ? ((r.votes / total) * 100).toFixed(1) : '0',
    }));

    res.json({ countries: result, total });
  } catch (err) {
    logger.error('Error fetching geo distribution:', err);
    res.status(500).json({ message: 'Error fetching geo distribution' });
  }
};

/**
 * GET /api/analytics/peak-times
 * Returns hourly and daily (day-of-week) vote distribution.
 */
export const getPeakTimes = async (req, res) => {
  const owner_id = req.user?.id;
  const { server_id, from, to } = req.query;

  if (!owner_id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let baseWhere = 'WHERE s.owner_id = ?';
    const params = [owner_id];

    if (server_id && server_id !== 'all') {
      baseWhere += ' AND v.server_id = ?';
      params.push(server_id);
    }
    if (from) {
      baseWhere += ' AND v.voted_at >= ?';
      params.push(from.replace('T', ' ').replace('Z', ''));
    }
    if (to) {
      baseWhere += ' AND v.voted_at <= ?';
      params.push(to.replace('T', ' ').replace('Z', ''));
    }

    // Hourly breakdown (0–23)
    const [hourly] = await pool.query(
      `SELECT HOUR(v.voted_at) AS hour, COUNT(*) AS votes
       FROM votes v JOIN servers s ON v.server_id = s.id
       ${baseWhere}
       GROUP BY hour ORDER BY hour`,
      params
    );

    // Day-of-week breakdown (1=Sunday ... 7=Saturday)
    const [weekly] = await pool.query(
      `SELECT DAYOFWEEK(v.voted_at) AS day_of_week, COUNT(*) AS votes
       FROM votes v JOIN servers s ON v.server_id = s.id
       ${baseWhere}
       GROUP BY day_of_week ORDER BY day_of_week`,
      params
    );

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Fill in zeroes for missing hours/days
    const hourlyFull = Array.from({ length: 24 }, (_, i) => {
      const found = hourly.find(r => r.hour === i);
      return { hour: `${String(i).padStart(2, '0')}:00`, votes: found ? found.votes : 0 };
    });

    const weeklyFull = Array.from({ length: 7 }, (_, i) => {
      const found = weekly.find(r => r.day_of_week === i + 1);
      return { day: dayNames[i], votes: found ? found.votes : 0 };
    });

    res.json({ hourly: hourlyFull, weekly: weeklyFull });
  } catch (err) {
    logger.error('Error fetching peak times:', err);
    res.status(500).json({ message: 'Error fetching peak times' });
  }
};

/**
 * GET /api/analytics/referrers
 * Returns vote counts by referrer source with conversion rates.
 */
export const getReferrers = async (req, res) => {
  const owner_id = req.user?.id;
  const { server_id, from, to } = req.query;

  if (!owner_id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let query = `
      SELECT
        COALESCE(
          CASE
            WHEN v.tracking_param IS NOT NULL AND v.tracking_param != '' THEN CONCAT('Tracked: ', v.tracking_param)
            WHEN v.referrer IS NOT NULL AND v.referrer != '' THEN
              CASE
                WHEN v.referrer LIKE '%discord%' THEN 'Discord'
                WHEN v.referrer LIKE '%facebook%' THEN 'Facebook'
                WHEN v.referrer LIKE '%twitter%' OR v.referrer LIKE '%x.com%' THEN 'Twitter/X'
                WHEN v.referrer LIKE '%reddit%' THEN 'Reddit'
                WHEN v.referrer LIKE '%youtube%' THEN 'YouTube'
                WHEN v.referrer LIKE '%google%' THEN 'Google'
                ELSE 'Other Website'
              END
            ELSE 'Direct / Unknown'
          END,
          'Direct / Unknown'
        ) AS source,
        COUNT(*) AS votes,
        SUM(CASE WHEN v.is_suspicious = 0 THEN 1 ELSE 0 END) AS verified_votes,
        ROUND(SUM(CASE WHEN v.is_suspicious = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS conversion_rate
      FROM votes v
      JOIN servers s ON v.server_id = s.id
      WHERE s.owner_id = ?
    `;
    const params = [owner_id];

    if (server_id && server_id !== 'all') {
      query += ' AND v.server_id = ?';
      params.push(server_id);
    }
    if (from) {
      query += ' AND v.voted_at >= ?';
      params.push(from.replace('T', ' ').replace('Z', ''));
    }
    if (to) {
      query += ' AND v.voted_at <= ?';
      params.push(to.replace('T', ' ').replace('Z', ''));
    }

    query += ' GROUP BY source ORDER BY votes DESC LIMIT 15';

    const [rows] = await pool.query(query, params);
    const total = rows.reduce((s, r) => s + r.votes, 0);
    const result = rows.map(r => ({
      ...r,
      percentage: total > 0 ? ((r.votes / total) * 100).toFixed(1) : '0',
    }));

    res.json({ sources: result, total });
  } catch (err) {
    logger.error('Error fetching referrers:', err);
    res.status(500).json({ message: 'Error fetching referrers' });
  }
};

/**
 * GET /api/analytics/demographics
 * Returns player demographics: device type, browser, OS from user-agent.
 */
export const getDemographics = async (req, res) => {
  const owner_id = req.user?.id;
  const { server_id, from, to } = req.query;

  if (!owner_id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let baseWhere = 'WHERE s.owner_id = ?';
    const params = [owner_id];

    if (server_id && server_id !== 'all') {
      baseWhere += ' AND v.server_id = ?';
      params.push(server_id);
    }
    if (from) {
      baseWhere += ' AND v.voted_at >= ?';
      params.push(from.replace('T', ' ').replace('Z', ''));
    }
    if (to) {
      baseWhere += ' AND v.voted_at <= ?';
      params.push(to.replace('T', ' ').replace('Z', ''));
    }

    // Device type from user agent
    const [devices] = await pool.query(
      `SELECT
        CASE
          WHEN v.voter_user_agent LIKE '%Mobile%' OR v.voter_user_agent LIKE '%Android%' OR v.voter_user_agent LIKE '%iPhone%' THEN 'Mobile'
          WHEN v.voter_user_agent LIKE '%Tablet%' OR v.voter_user_agent LIKE '%iPad%' THEN 'Tablet'
          WHEN v.voter_user_agent IS NULL OR v.voter_user_agent = '' THEN 'API/Bot'
          ELSE 'Desktop'
        END AS device,
        COUNT(*) AS votes
       FROM votes v JOIN servers s ON v.server_id = s.id
       ${baseWhere}
       GROUP BY device ORDER BY votes DESC`,
      params
    );

    // Browser from user agent
    const [browsers] = await pool.query(
      `SELECT
        CASE
          WHEN v.voter_user_agent LIKE '%Chrome%' AND v.voter_user_agent NOT LIKE '%Chromium%' AND v.voter_user_agent NOT LIKE '%Edge%' THEN 'Chrome'
          WHEN v.voter_user_agent LIKE '%Firefox%' THEN 'Firefox'
          WHEN v.voter_user_agent LIKE '%Safari%' AND v.voter_user_agent NOT LIKE '%Chrome%' THEN 'Safari'
          WHEN v.voter_user_agent LIKE '%Edge%' THEN 'Edge'
          WHEN v.voter_user_agent LIKE '%Opera%' OR v.voter_user_agent LIKE '%OPR%' THEN 'Opera'
          WHEN v.voter_user_agent IS NULL OR v.voter_user_agent = '' THEN 'API/Bot'
          ELSE 'Other'
        END AS browser,
        COUNT(*) AS votes
       FROM votes v JOIN servers s ON v.server_id = s.id
       ${baseWhere}
       GROUP BY browser ORDER BY votes DESC`,
      params
    );

    // Challenge type breakdown with conversion rate
    const [challenges] = await pool.query(
      `SELECT
        COALESCE(v.challenge_type_passed, 'api') AS challenge_type,
        COUNT(*) AS total,
        SUM(CASE WHEN v.is_suspicious = 0 THEN 1 ELSE 0 END) AS verified,
        ROUND(SUM(CASE WHEN v.is_suspicious = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS conversion_rate
       FROM votes v JOIN servers s ON v.server_id = s.id
       ${baseWhere}
       GROUP BY challenge_type ORDER BY total DESC`,
      params
    );

    res.json({ devices, browsers, challenges });
  } catch (err) {
    logger.error('Error fetching demographics:', err);
    res.status(500).json({ message: 'Error fetching demographics' });
  }
};
