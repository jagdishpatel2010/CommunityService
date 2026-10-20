import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/services.js';
import { getToken, setToken, clearToken } from '../api/client.js';

/**
 * Authentication context. Holds the current user, exposes login/register/logout,
 * and restores the session from a stored JWT on first load.
 */
const AuthContext = createContext(null);

/**
 * Provider that wraps the app and supplies auth state + actions.
 *
 * @param {{children: React.ReactNode}} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` covers the initial "am I logged in?" check so routes can wait.
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, fetch the profile to rehydrate the session.
  useEffect(() => {
    let active = true;
    async function restore() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await authApi.me();
        if (active) setUser(me);
      } catch {
        clearToken();
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, []);

  /** Logs in and stores the returned token + user. */
  const login = useCallback(async (credentials) => {
    const { token, user: me } = await authApi.login(credentials);
    setToken(token);
    setUser(me);
    return me;
  }, []);

  /** Registers a new user account and logs them in. */
  const register = useCallback(async (payload) => {
    const { token, user: me } = await authApi.register(payload);
    setToken(token);
    setUser(me);
    return me;
  }, []);

  /** Clears the session. */
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = { user, setUser, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access the auth context.
 *
 * @returns {{user: object|null, loading: boolean, login: Function, register: Function, logout: Function, setUser: Function}}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
