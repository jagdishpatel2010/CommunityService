/**
 * Wraps an async route handler so rejected promises are forwarded to Express's
 * error pipeline instead of crashing the process.
 *
 * @param {Function} fn - An async (req, res, next) handler.
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Handles requests to unknown routes with a 404. */
export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

/**
 * Central error handler. Logs the full error server-side but returns a
 * generic message to the client so internals are never leaked.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  // Mongoose duplicate key (e.g. email already registered).
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists' });
  }
  // Mongoose validation errors map to 400 with field messages.
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation failed', details });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: status === 500 ? 'An unexpected error occurred' : err.message,
  });
}

/**
 * Small helper to throw an HTTP error with a status code from anywhere.
 *
 * @param {number} statusCode - HTTP status.
 * @param {string} message - Error message.
 */
export function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
