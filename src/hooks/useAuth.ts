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
import { setCurrentUserId } from '../services/data';

/** Translate Firebase Auth error codes into user-friendly messages. */
function mapAuthError(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: string }).code;
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. If you created your account with Google, please use the "Sign in with Google" button. Otherwise, please check your credentials and try again.';
      case 'auth/account-exists-with-different-credential':
        return 'This email is already linked to a different sign-in method. Please use the "Sign in with Google" button to access your account.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later or reset your password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in request was cancelled. Please try again.';
      default:
        return err.message;
    }
  }
  return 'Login failed';
}

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
        if (currentUser) {
          setCurrentUserId(currentUser.id);
          startSessionMonitor();
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
    const unsubscribe = subscribeToAuthState((u) => {
      setUser(u);
      if (u) {
        setCurrentUserId(u.id);
        startSessionMonitor();
      } else {
        setCurrentUserId('');
        stopSessionMonitor();
      }
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
      const m = mapAuthError(err); setError(m); throw err;
    }
    finally { setLoading(false); }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUser(await authLoginWithGoogle()); }
    catch (err) {
      if (err instanceof MfaRequiredError) { throw err; }
      const m = mapAuthError(err); setError(m); throw err;
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
