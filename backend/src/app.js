import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middleware/error.js';
import { UPLOAD_DIR } from './middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Builds and configures the Express application.
 *
 * @returns {import('express').Express} The configured app.
 */
export function createApp() {
  const app = express();

  // Restrict CORS to the known frontend origins from the environment.
  const origins = (process.env.CLIENT_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(cors({ origin: origins.length ? origins : true }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  // Serve uploaded evidence/completion images.
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Simple health check.
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Feature routes.
  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 + central error handler (must be last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
