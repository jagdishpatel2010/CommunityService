import axios from 'axios';

/**
 * Shared Axios instance. The base URL is relative ("/api") so the Vite dev
 * proxy forwards requests to the Express backend. A request interceptor
 * attaches the stored JWT as a Bearer token on every call.
 */
const api = axios.create({ baseURL: '/api' });

const TOKEN_KEY = 'ccms_token';

/** Reads the persisted JWT. @returns {string|null} */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/** Persists the JWT. @param {string} token */
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

/** Removes the persisted JWT. */
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Attach the bearer token to outgoing requests when present.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Normalises an Axios error into a readable message for the UI.
 *
 * @param {unknown} err - The thrown error.
 * @returns {string} A user-facing message.
 */
export function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?.details?.length) return err.response.data.details.join(', ');
  if (err?.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export default api;
