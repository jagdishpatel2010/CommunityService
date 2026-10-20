import jwt from 'jsonwebtoken';

/**
 * Signs a JWT for the given user id and role.
 *
 * @param {object} payload - Token payload, typically { id, role }.
 * @returns {string} A signed JWT.
 */
export function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Verifies and decodes a JWT.
 *
 * @param {string} token - The raw JWT string.
 * @returns {object} The decoded payload.
 */
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
