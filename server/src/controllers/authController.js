import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';

export const register = async (req, res) => {
  const { email, password, username, display_name } = req.body;

  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        [userId, email, password_hash]
      );

      await connection.query(
        'INSERT INTO profiles (id, public_id, username, display_name) VALUES (?, ?, ?, ?)',
        [userId, uuidv4(), username || email.split('@')[0], display_name || username || email.split('@')[0]]
      );

      await connection.query(
        'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
        [uuidv4(), userId, 'player']
      );

      await connection.commit();

      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id: userId, email } });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const [profiles] = await pool.query(
      `SELECT p.*, GROUP_CONCAT(r.role) as roles 
       FROM profiles p 
       LEFT JOIN user_roles r ON p.id = r.user_id 
       WHERE p.id = ? 
       GROUP BY p.id`,
      [req.user.id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = profiles[0];
    profile.roles = profile.roles ? profile.roles.split(',') : [];

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};
