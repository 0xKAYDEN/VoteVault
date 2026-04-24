import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import pool from '../db.js';
import { sendEmail } from '../utils/email.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by google_id or email
    const [users] = await pool.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
    
    let userId;
    if (users.length > 0) {
      const user = users[0];
      userId = user.id;
      // Link google_id if not linked
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = ?, is_verified = TRUE WHERE id = ?', [googleId, userId]);
      }
    } else {
      // Create new user
      userId = uuidv4();
      const password_hash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          'INSERT INTO users (id, email, password_hash, google_id, is_verified) VALUES (?, ?, ?, ?, TRUE)',
          [userId, email, password_hash, googleId]
        );
        await connection.query(
          'INSERT INTO profiles (id, public_id, username, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)',
          [userId, uuidv4(), email.split('@')[0], name, picture]
        );
        await connection.query(
          'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
          [uuidv4(), userId, 'player']
        );
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    }

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, email } });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(400).json({ message: 'Google authentication failed' });
  }
};

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
    const verification_token = crypto.randomBytes(32).toString('hex');

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'INSERT INTO users (id, email, password_hash, verification_token) VALUES (?, ?, ?, ?)',
        [userId, email, password_hash, verification_token]
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

      // Send verification email
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verification_token}`;
      await sendEmail({
        to: email,
        subject: 'Verify your email - Conquer Toplist',
        html: `<p>Please verify your email by clicking <a href="${verifyUrl}">here</a>.</p>`,
      });

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

export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE verification_token = ?', [token]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    await pool.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?', [users[0].id]);
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};

export const login = async (req, res) => {
  const { email, password, twoFactorToken } = req.body;

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

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      if (!twoFactorToken) {
        return res.status(200).json({
          requires2FA: true,
          message: 'Two-factor authentication required'
        });
      }

      // Verify 2FA token
      const speakeasy = (await import('speakeasy')).default;
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2
      });

      // If token verification fails, check backup codes
      if (!verified) {
        if (user.two_factor_backup_codes) {
          const backupCodes = JSON.parse(user.two_factor_backup_codes);
          const codeIndex = backupCodes.indexOf(twoFactorToken);

          if (codeIndex === -1) {
            return res.status(400).json({ message: 'Invalid two-factor code' });
          }

          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await pool.query(
            'UPDATE users SET two_factor_backup_codes = ? WHERE id = ?',
            [JSON.stringify(backupCodes), user.id]
          );
        } else {
          return res.status(400).json({ message: 'Invalid two-factor code' });
        }
      }
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, is_verified: user.is_verified } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.json({ message: 'If that email is in our system, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?',
      [resetToken, expires, email]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Password Reset - Conquer Toplist',
      html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset it. Link expires in 1 hour.</p>`,
    });

    res.json({ message: 'If that email is in our system, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const [users] = await pool.query(
      'SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [password_hash, users[0].id]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const [profiles] = await pool.query(
      `SELECT p.*, u.email, GROUP_CONCAT(r.role) as roles, u.is_verified, u.google_id
       FROM profiles p
       LEFT JOIN user_roles r ON p.id = r.user_id
       JOIN users u ON p.id = u.id
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

export const updateProfile = async (req, res) => {
  const { display_name, avatar_url, bio } = req.body;
  const userId = req.user.id;

  try {
    await pool.query(
      'UPDATE profiles SET display_name = ?, avatar_url = ?, bio = ? WHERE id = ?',
      [display_name, avatar_url, bio, userId]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

export const updateEmail = async (req, res) => {
  const { email } = req.body;
  const userId = req.user.id;

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    await pool.query('UPDATE users SET email = ?, is_verified = FALSE WHERE id = ?', [email, userId]);
    res.json({ message: 'Email updated. Please verify your new email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating email' });
  }
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating password' });
  }
};
