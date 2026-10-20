import { httpError } from '../middleware/error.js';

/**
 * Minimal, dependency-free validation helpers. Each throws an HTTP 400 error
 * (via httpError) when a rule fails, keeping controllers clean.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Asserts that every listed field is present and non-empty on the body.
 *
 * @param {object} body - Request body.
 * @param {string[]} fields - Required field names.
 */
export function requireFields(body, fields) {
  const missing = fields.filter((f) => {
    const v = body[f];
    return v === undefined || v === null || String(v).trim() === '';
  });
  if (missing.length) {
    throw httpError(400, `Missing required field(s): ${missing.join(', ')}`);
  }
}

/**
 * Validates an email address format.
 *
 * @param {string} email - Candidate email.
 */
export function assertEmail(email) {
  if (!EMAIL_RE.test(String(email))) {
    throw httpError(400, 'Please provide a valid email address');
  }
}

/**
 * Enforces a minimum password length.
 *
 * @param {string} password - Candidate password.
 * @param {number} [min=6] - Minimum length.
 */
export function assertPassword(password, min = 6) {
  if (String(password).length < min) {
    throw httpError(400, `Password must be at least ${min} characters`);
  }
}

/**
 * Ensures a value is one of an allowed set.
 *
 * @param {string} value - Value to check.
 * @param {string[]} allowed - Allowed values.
 * @param {string} label - Field label for the error message.
 */
export function assertEnum(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw httpError(400, `Invalid ${label}. Allowed: ${allowed.join(', ')}`);
  }
}
