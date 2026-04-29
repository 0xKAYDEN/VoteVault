import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import pool from '../db.js';
import { sendEmail } from '../utils/email.js';
import { cache } from '../utils/cache.js';
import logger from '../utils/logger.js';

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
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    };
    res.cookie('auth_token', token, cookieOptions);
    res.json({ user: { id: userId, email } });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(400).json({ message: 'Google authentication failed' });
  }
};

export const register = async (req, res) => {
  const { email, password, username, display_name, recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ message: 'reCAPTCHA token is required' });
  }

  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const [existingUsername] = await pool.query('SELECT * FROM profiles WHERE username = ?', [username]);
    if (existingUsername.length > 0) {
      return res.status(400).json({ message: 'Username already taken' });
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
        'INSERT INTO profiles (id, public_id, username, display_name, discriminator) VALUES (?, ?, ?, ?, ?)',
        [userId, uuidv4(), username || email.split('@')[0], display_name || username || email.split('@')[0], Math.floor(1000 + Math.random() * 9000)]
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
        subject: 'Verify your VoteVault account',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#e11d48">Welcome to VoteVault!</h2>
            <p>Thanks for signing up. Click the button below to verify your email address.</p>
            <a href="${verifyUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#e11d48;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
              Verify Email
            </a>
            <p style="color:#888;font-size:12px">Or copy this link: ${verifyUrl}</p>
            <p style="color:#888;font-size:12px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
          </div>
        `,
      });

      // Do NOT return a JWT — user must verify email first
      res.status(201).json({
        requiresVerification: true,
        message: 'Account created! Please check your email to verify your account before signing in.',
      });
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
    res.json({ message: 'Email verified successfully. You can now sign in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const [users] = await pool.query(
      'SELECT id, is_verified FROM users WHERE email = ?', [email]
    );
    // Always respond the same way to avoid email enumeration
    if (!users.length || users[0].is_verified) {
      return res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
    }
    const newToken = crypto.randomBytes(32).toString('hex');
    await pool.query('UPDATE users SET verification_token = ? WHERE id = ?', [newToken, users[0].id]);
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${newToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify your VoteVault account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#e11d48">Verify your email</h2>
          <p>Click the button below to verify your email address.</p>
          <a href="${verifyUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#e11d48;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
            Verify Email
          </a>
          <p style="color:#888;font-size:12px">Or copy this link: ${verifyUrl}</p>
        </div>
      `,
    });
    res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { email, password, twoFactorToken, recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ message: 'reCAPTCHA token is required' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // FIX #1: Block banned users from logging in
    if (user.is_banned) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    // Block unverified users
    if (!user.is_verified) {
      return res.status(403).json({
        message: 'Please verify your email before signing in.',
        requiresVerification: true,
        email: user.email,
      });
    }

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

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: req.body.rememberMe ? '30d' : '7d'
    });

    // Set HttpOnly cookie — JS cannot read this, eliminating XSS token theft
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'strict',
      path: '/',
      ...(req.body.rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}), // session vs persistent
    };
    res.cookie('auth_token', token, cookieOptions);

    res.json({ user: { id: user.id, email: user.email, is_verified: user.is_verified } });
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
    // Hash before storing — raw token goes in the email link, hash goes in DB
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Use MySQL's DATE_ADD(NOW(), ...) so expiry is always in the DB's own timezone
    await pool.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?',
      [tokenHash, users[0].id]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Password Reset — VoteVault',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#e11d48">Reset your password</h2>
          <p>Click the button below to reset your password. This link expires in 24 hours.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#e11d48;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
            Reset Password
          </a>
          <p style="color:#888;font-size:12px">Or copy this link: ${resetUrl}</p>
          <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'If that email is in our system, a reset link has been sent.' });
  } catch (err) {
    logger.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    // Hash the incoming token to compare against the stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [users] = await pool.query(
      'SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [tokenHash]
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
    logger.error('resetPassword error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// FIX #12: Include email from the users join, not empty string
export const getMe = async (req, res) => {
  try {
    const cacheKey = `user:profile:${req.user.id}`;
    const cachedProfile = await cache.get(cacheKey);

    if (cachedProfile) {
      logger.info(`Cache HIT: ${cacheKey}`);
      return res.json(cachedProfile);
    }

    logger.info(`Cache MISS: ${cacheKey}`);
    const [profiles] = await pool.query(
      `SELECT p.*, u.email, u.is_verified, u.google_id,
              GROUP_CONCAT(r.role) as roles
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

    await cache.set(cacheKey, profile, 300);
    res.json(profile);
  } catch (err) {
    logger.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  const { display_name, avatar_url, bio, social_discord, social_twitter, social_youtube, social_twitch, social_website } = req.body;
  const userId = req.user.id;

  try {
    // Check premium status for bio limit
    const [premiumRows] = await pool.query(
      `SELECT plan FROM payments WHERE user_id = ? AND status = 'active' AND expires_at > NOW() LIMIT 1`,
      [userId]
    );
    const isPremium = premiumRows.length > 0;
    const maxBio = isPremium ? 1000 : 200;

    if (bio !== undefined && bio.length > maxBio) {
      return res.status(400).json({ message: `Bio cannot exceed ${maxBio} characters` });
    }

    const fields = {};
    if (display_name !== undefined) fields.display_name = display_name;
    if (avatar_url !== undefined) fields.avatar_url = avatar_url;
    if (bio !== undefined) fields.bio = bio;
    if (social_discord !== undefined) fields.social_discord = social_discord;
    if (social_twitter !== undefined) fields.social_twitter = social_twitter;
    if (social_youtube !== undefined) fields.social_youtube = social_youtube;
    if (social_twitch !== undefined) fields.social_twitch = social_twitch;
    if (social_website !== undefined) fields.social_website = social_website;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const setClauses = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE profiles SET ${setClauses} WHERE id = ?`, [...Object.values(fields), userId]);

    // Invalidate cache
    await cache.del(`user:profile:${userId}`);

    logger.info(`Profile updated for user ${userId}`);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    logger.error('Error updating profile:', err);
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

export const logout = (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  res.json({ message: 'Logged out successfully' });
};
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
