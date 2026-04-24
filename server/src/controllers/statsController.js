import db from '../db.js';

// Get site-wide statistics
export const getSiteStats = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT SUM(visits) as total_visits FROM site_stats'
    );

    res.json({
      total_visits: result[0]?.total_visits || 0
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    res.status(500).json({ error: 'Failed to fetch site stats' });
  }
};

// Get total website visits
export const getTotalVisits = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT SUM(visits) as total_visits FROM site_stats'
    );

    res.json({
      total_visits: result[0]?.total_visits || 0
    });
  } catch (error) {
    console.error('Error fetching total visits:', error);
    res.status(500).json({ error: 'Failed to fetch total visits' });
  }
};

// Get stats by date range
export const getStatsByDateRange = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = 'SELECT * FROM site_stats';
    const params = [];

    if (start_date && end_date) {
      query += ' WHERE date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY date DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
