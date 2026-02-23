import { useState, useEffect, useCallback } from 'react';
import {
  User,
  MfaRequiredError,
  login as authLogin,
  loginWithGoogle as authLoginWithGoogle,
  logout as authLogout,
  register as authRegister,
  requestPasswordReset,
  updateCurrentUserProfile,
  getCurrentUser,
  subscribeToAuthState,
  startSessionMonitor,
  stopSessionMonitor
} from '../services/auth/authService';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (displayName: string, email: string, password: string, extra?: { phone?: string; organization?: string; address?: string }) => Promise<void>;
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
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) startSessionMonitor();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
    const unsubscribe = subscribeToAuthState((u) => {
      setUser(u);
      if (u) startSessionMonitor();
      else stopSessionMonitor();
    });
    return () => {
      unsubscribe();
      stopSessionMonitor();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try { setUser(await authLogin(email, password)); }
    catch (err) {
      if (err instanceof MfaRequiredError) { throw err; }
      const m = err instanceof Error ? err.message : 'Login failed'; setError(m); throw err;
    }
    finally { setLoading(false); }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUser(await authLoginWithGoogle()); }
    catch (err) {
      if (err instanceof MfaRequiredError) { throw err; }
      const m = err instanceof Error ? err.message : 'Google sign-in failed'; setError(m); throw err;
    }
    finally { setLoading(false); }
  }, []);

  const register = useCallback(async (displayName: string, email: string, password: string, extra?: { phone?: string; organization?: string; address?: string }) => {
    setLoading(true); setError(null);
    try { setUser(await authRegister({ displayName, email, password, ...extra })); }
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

  return { user, loading, error, isAuthenticated: !!user, login, loginWithGoogle, register, requestReset, updateProfile, logout, refresh };
}
