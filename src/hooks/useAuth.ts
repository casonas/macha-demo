import { useState, useEffect, useCallback } from 'react';
import {
  User,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  requestPasswordReset,
  updateCurrentUserProfile,
  getCurrentUser,
  subscribeToAuthState
} from '../services/auth/authService';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  requestReset: (email: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setUser(await getCurrentUser());
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
    const unsubscribe = subscribeToAuthState(setUser);
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try { setUser(await authLogin(email, password)); }
    catch (err) { const m = err instanceof Error ? err.message : 'Login failed'; setError(m); throw err; }
    finally { setLoading(false); }
  }, []);

  const register = useCallback(async (displayName: string, email: string, password: string) => {
    setLoading(true); setError(null);
    try { setUser(await authRegister({ displayName, email, password })); }
    catch (err) { const m = err instanceof Error ? err.message : 'Register failed'; setError(m); throw err; }
    finally { setLoading(false); }
  }, []);

  const requestReset = useCallback(async (email: string) => {
    await requestPasswordReset(email);
  }, []);

  const updateProfile = useCallback(async (displayName: string) => {
    const updated = await updateCurrentUserProfile({ displayName });
    if (updated) setUser(updated);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try { await authLogout(); setUser(null); }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(async () => {
    setUser(await getCurrentUser());
  }, []);

  return { user, loading, error, isAuthenticated: !!user, login, register, requestReset, updateProfile, logout, refresh };
}
