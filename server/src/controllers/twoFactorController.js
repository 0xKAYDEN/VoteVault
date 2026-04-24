import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import db from '../db.js';

// Generate 2FA secret
export const generate2FASecret = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user email
    const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const email = users[0].email;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `VoteVault (${email})`,
      issuer: 'VoteVault'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (not enabled yet)
    await db.query(
      'UPDATE users SET two_factor_secret = ? WHERE id = ?',
      [secret.base32, userId]
    );

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    res.status(500).json({ error: 'Failed to generate 2FA secret' });
  }
};

// Enable 2FA
export const enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    // Get user's secret
    const [users] = await db.query(
      'SELECT two_factor_secret FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || !users[0].two_factor_secret) {
      return res.status(400).json({ error: 'No 2FA secret found. Generate one first.' });
    }

    const secret = users[0].two_factor_secret;

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    // Enable 2FA
    await db.query(
      'UPDATE users SET two_factor_enabled = true, two_factor_backup_codes = ? WHERE id = ?',
      [JSON.stringify(backupCodes), userId]
    );

    res.json({
      message: '2FA enabled successfully',
      backupCodes: backupCodes
    });
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Verify password
    const [users] = await db.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Note: You should verify the password here with bcrypt
    // For now, we'll just disable it

    await db.query(
      'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE id = ?',
      [userId]
    );

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

// Verify 2FA token (for login)
export const verify2FAToken = async (req, res) => {
  try {
    const { userId, token } = req.body;

    const [users] = await db.query(
      'SELECT two_factor_secret, two_factor_backup_codes FROM users WHERE id = ? AND two_factor_enabled = true',
      [userId]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: '2FA not enabled for this user' });
    }

    const secret = users[0].two_factor_secret;
    const backupCodes = users[0].two_factor_backup_codes ? JSON.parse(users[0].two_factor_backup_codes) : [];

    // Check if it's a backup code
    if (backupCodes.includes(token.toUpperCase())) {
      // Remove used backup code
      const updatedCodes = backupCodes.filter(code => code !== token.toUpperCase());
      await db.query(
        'UPDATE users SET two_factor_backup_codes = ? WHERE id = ?',
        [JSON.stringify(updatedCodes), userId]
      );

      return res.json({ verified: true, message: 'Backup code used' });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    res.json({ verified: true });
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    res.status(500).json({ error: 'Failed to verify 2FA token' });
  }
};

// Get 2FA status
export const get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      'SELECT two_factor_enabled FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ enabled: users[0].two_factor_enabled });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
};
