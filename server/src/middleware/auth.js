import jwt from 'jsonwebtoken';

/**
 * JWT authentication middleware.
 *
 * Token resolution order (first match wins):
 *   1. HttpOnly cookie `auth_token`  — browser clients (XSS-safe)
 *   2. Authorization: Bearer <token> — API tools, mobile apps, server-to-server
 *
 * This dual strategy lets browser sessions use the secure cookie path while
 * keeping the Bearer header path available for non-browser consumers.
 */
const auth = (req, res, next) => {
  // 1. Cookie (preferred for browser clients)
  let token = req.cookies?.auth_token;

  // 2. Authorization header fallback
  if (!token) {
    const header = req.header('Authorization');
    if (header?.startsWith('Bearer ')) {
      token = header.slice(7).trim();
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;
