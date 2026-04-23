import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';

export const getApiKeys = async (req, res) => {
  const owner_id = req.user.id;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM api_keys WHERE owner_id = ? ORDER BY created_at DESC',
      [owner_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching API keys' });
  }
};

export const createApiKey = async (req, res) => {
  const { server_id, key_prefix, key_hash, label } = req.body;
  const owner_id = req.user.id;

  try {
    const public_id = uuidv4();
    await pool.query(
      `INSERT INTO api_keys (public_id, owner_id, server_id, key_prefix, key_hash, label) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [public_id, owner_id, server_id || null, key_prefix, key_hash, label || null]
    );
    res.status(201).json({ message: 'API key created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating API key' });
  }
};

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
    console.error(err);
    res.status(500).json({ message: 'Error revoking API key' });
  }
};
