import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

/**
 * Express middleware that authenticates a request using a Bearer JWT.
 * On success it attaches the current user document to req.user.
 *
 * Note: tokens are passed in the Authorization header. This matches the
 * REST API + SPA architecture required by the brief. Error messages are kept
 * generic so no account details leak to unauthenticated callers.
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive account' });
    }

    req.user = user;
    next();
  } catch {
    // Any verification error (expired/tampered token) yields a generic 401.
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Returns middleware that allows the request only if the authenticated user
 * has one of the permitted roles. Must run after `authenticate`.
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'staff').
 * @returns {import('express').RequestHandler} Authorization middleware.
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}
