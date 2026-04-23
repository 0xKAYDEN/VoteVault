import pool from '../db.js';

export const trackVisit = async (req, res, next) => {
  // Only track GET requests to the main API or as needed
  // This is a simple implementation that increments visits for the current day
  if (req.method === 'GET' && !req.path.startsWith('/uploads')) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await pool.query(
        `INSERT INTO site_stats (date, visits) 
         VALUES (?, 1) 
         ON DUPLICATE KEY UPDATE visits = visits + 1`,
        [today]
      );
    } catch (err) {
      console.error('Error tracking site visit:', err);
    }
  }
  next();
};

export const trackVote = async () => {
  const today = new Date().toISOString().split('T')[0];
  try {
    await pool.query(
      `INSERT INTO site_stats (date, votes) 
       VALUES (?, 1) 
       ON DUPLICATE KEY UPDATE votes = votes + 1`,
      [today]
    );
  } catch (err) {
    console.error('Error tracking site vote:', err);
  }
};
