import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server runs on 5173 (matches the backend CLIENT_ORIGINS allowlist).
// Requests to /api and /uploads are proxied to the Express backend on :5000
// so the frontend can use same-origin relative URLs during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
