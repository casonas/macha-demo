/**
 * Authentication Service
 * Uses Firebase Auth when configured, falls back to mock for development.
 * Set REACT_APP_DATA_PROVIDER=firebase in .env to enable Firebase Auth.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithCustomToken as firebaseSignInWithCustomToken,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getMultiFactorResolver,
  type MultiFactorError,
  type User as FirebaseUser,
  type ActionCodeSettings
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../firebaseConfig';

const USE_FIREBASE = (process.env.REACT_APP_DATA_PROVIDER || 'firebase') === 'firebase';

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: ('admin' | 'user' | 'manager')[];
  assignedBuildings: string[];
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

let MOCK_USERS: Record<string, { password: string; user: User }> = {};

type AuthStateListener = (user: User | null) => void;
const listeners: AuthStateListener[] = [];

const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();
const MAX_ATTEMPTS = Number(process.env.REACT_APP_MAX_LOGIN_ATTEMPTS || 5);
const LOCK_WINDOW_MS = 10 * 60 * 1000;
const MFA_TRUST_KEY = 'macha.mfaTrustedDevice';
const MFA_TRUST_DURATION_MS = 24 * 60 * 60 * 1000;

function notifyListeners(user: User | null) {
  listeners.forEach(listener => listener(user));
}

function firebaseUserToUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || '',
    roles: ['user'],
    assignedBuildings: ['building-001']
  };
}

/**
 * Fetch user roles from Firestore and return an enriched User object.
 */
async function enrichUserWithRoles(fbUser: FirebaseUser): Promise<User> {
  const base = firebaseUserToUser(fbUser);
  if (!USE_FIREBASE) return base;
  try {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.roles) && data.roles.length > 0) {
        base.roles = data.roles;
      }
      if (Array.isArray(data.assignedBuildings) && data.assignedBuildings.length > 0) {
        base.assignedBuildings = data.assignedBuildings;
      }
    }
  } catch (err) {
    console.error('Failed to fetch user roles from Firestore:', err);
  }
  return base;
}

/**
 * Build ActionCodeSettings for email actions (verification, password reset).
 * These settings direct the user back to the app without relying on Firebase Dynamic Links.
 */
function getActionCodeSettings(): ActionCodeSettings {
  const authDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
  const url = authDomain ? `https://${authDomain}` : window.location.origin;
  return {
    url,
    handleCodeInApp: false,
  };
}

async function saveUserProfileToFirestore(fbUser: FirebaseUser, extra?: { phone?: string; organization?: string; address?: string }) {
  if (!USE_FIREBASE) return;
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || '',
        phone: extra?.phone || '',
        organization: extra?.organization || '',
        address: extra?.address || '',
        roles: ['user'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error('Failed to save user profile to Firestore:', err);
  }
}

function setSession(user: User) {
  const session: AuthSession = {
    user,
    token: `mock-token-${Date.now()}`,
    expiresAt: Date.now() + 3600000
  };
  localStorage.setItem('mockAuthSession', JSON.stringify(session));
}

function rememberTrustedMfaDevice(userId: string): void {
  const record = {
    userId,
    expiresAt: Date.now() + MFA_TRUST_DURATION_MS
  };
  localStorage.setItem(MFA_TRUST_KEY, JSON.stringify(record));
}

function hasValidTrustedMfaDevice(userId: string): boolean {
  try {
    const raw = localStorage.getItem(MFA_TRUST_KEY);
    if (!raw) return false;
    const record = JSON.parse(raw) as { userId?: string; expiresAt?: number };
    if (record.userId !== userId) return false;
    if (typeof record.expiresAt !== 'number') return false;
    if (Date.now() >= record.expiresAt) {
      localStorage.removeItem(MFA_TRUST_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(MFA_TRUST_KEY);
    return false;
  }
}

export function subscribeToAuthState(listener: AuthStateListener): () => void {
  listeners.push(listener);

  if (USE_FIREBASE) {
    const unsubFirebase = onAuthStateChanged(getFirebaseAuth(), (fbUser) => {
      const user = fbUser ? firebaseUserToUser(fbUser) : null;
      listener(user);
    });
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
      unsubFirebase();
    };
  }

  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
}

/**
 * Custom error thrown when MFA verification is required during login.
 */
export class MfaRequiredError extends Error {
  code = 'auth/multi-factor-auth-required';
  resolver: any;
  pendingUser: User | null;

  constructor(resolver: any, pendingUser: User | null) {
    super('Multi-factor authentication required.');
    this.resolver = resolver;
    this.pendingUser = pendingUser;
  }
}

export async function login(email: string, password: string): Promise<User> {
  if (USE_FIREBASE) {
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const user = await enrichUserWithRoles(cred.user);
      notifyListeners(user);
      return user;
    } catch (err: any) {
      if (err?.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(getFirebaseAuth(), err as MultiFactorError);
        throw new MfaRequiredError(resolver, null);
      }
      throw err;
    }
  }

  // Mock login
  await new Promise(resolve => setTimeout(resolve, 500));
  const key = email.toLowerCase();
  const record = MOCK_USERS[key];

  const attempt = loginAttempts.get(key);
  if (attempt?.lockedUntil && Date.now() < attempt.lockedUntil) {
    throw new Error('Too many login attempts. Try again later.');
  }

  if (!record || record.password !== password) {
    const next = (attempt?.count || 0) + 1;
    if (next >= MAX_ATTEMPTS) {
      loginAttempts.set(key, { count: next, lockedUntil: Date.now() + LOCK_WINDOW_MS });
      throw new Error('Account temporarily locked after too many attempts.');
    }
    loginAttempts.set(key, { count: next });
    throw new Error('Invalid email or password');
  }

  loginAttempts.delete(key);

  // Check if MFA is enrolled in mock mode
  if (localStorage.getItem('macha.mfaEnrolled') === 'true' && !hasValidTrustedMfaDevice(record.user.id)) {
    throw new MfaRequiredError(null, record.user);
  }

  setSession(record.user);
  notifyListeners(record.user);
  return record.user;
}

/**
 * Complete login for a user who passed MFA verification (mock mode).
 */
export function completeMfaLogin(user: User): void {
  rememberTrustedMfaDevice(user.id);
  setSession(user);
  notifyListeners(user);
}

export async function loginWithGoogle(): Promise<User> {
  if (!USE_FIREBASE) {
    throw new Error('Google Sign-In is only available with Firebase.');
  }
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(getFirebaseAuth(), provider);
    await saveUserProfileToFirestore(cred.user);
    const user = await enrichUserWithRoles(cred.user);
    notifyListeners(user);
    return user;
  } catch (err: any) {
    if (err?.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(getFirebaseAuth(), err as MultiFactorError);
      throw new MfaRequiredError(resolver, null);
    }
    throw err;
  }
}

export async function register(input: { displayName: string; email: string; password: string; phone?: string; organization?: string; address?: string }): Promise<User> {
  if (USE_FIREBASE) {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), input.email, input.password);
    await updateProfile(cred.user, { displayName: input.displayName });
    await saveUserProfileToFirestore(cred.user, { phone: input.phone, organization: input.organization, address: input.address });
    // Send email verification so the user can verify before enrolling MFA.
    // Uses ActionCodeSettings that do not rely on Firebase Dynamic Links.
    try {
      await sendEmailVerification(cred.user, getActionCodeSettings());
    } catch (err) {
      console.error('Failed to send email verification:', err);
    }
    const user = firebaseUserToUser({ ...cred.user, displayName: input.displayName });
    notifyListeners(user);
    return user;
  }

  // Mock register
  await new Promise(resolve => setTimeout(resolve, 500));
  const key = input.email.toLowerCase();

  if (MOCK_USERS[key]) {
    throw new Error('An account with this email already exists');
  }

  if (input.password.length < 8 || !/[A-Z]/.test(input.password) || !/[0-9]/.test(input.password)) {
    throw new Error('Password must be 8+ chars and include at least one uppercase letter and one number.');
  }

  const user: User = {
    id: `user-${Date.now()}`,
    email: key,
    displayName: input.displayName,
    roles: ['user'],
    assignedBuildings: ['building-001']
  };

  MOCK_USERS = {
    ...MOCK_USERS,
    [key]: { password: input.password, user }
  };

  setSession(user);
  notifyListeners(user);
  return user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (USE_FIREBASE) {
    await sendPasswordResetEmail(getFirebaseAuth(), email, getActionCodeSettings());
    return;
  }
  await new Promise(resolve => setTimeout(resolve, 400));
  void email;
}

export async function updateCurrentUserProfile(input: { displayName: string }): Promise<User | null> {
  if (USE_FIREBASE) {
    const fbUser = getFirebaseAuth().currentUser;
    if (fbUser) {
      await updateProfile(fbUser, { displayName: input.displayName });
      const user = firebaseUserToUser({ ...fbUser, displayName: input.displayName });
      notifyListeners(user);
      return user;
    }
  }

  const current = await getCurrentUser();
  if (!current) return null;

  const updated: User = { ...current, displayName: input.displayName };

  const key = updated.email.toLowerCase();
  if (MOCK_USERS[key]) {
    MOCK_USERS[key] = { ...MOCK_USERS[key], user: updated };
  }

  setSession(updated);
  notifyListeners(updated);
  return updated;
}

export async function logout(): Promise<void> {
  if (USE_FIREBASE) {
    await signOut(getFirebaseAuth());
    notifyListeners(null);
    return;
  }
  await new Promise(resolve => setTimeout(resolve, 250));
  localStorage.removeItem('mockAuthSession');
  notifyListeners(null);
}

export async function getCurrentUser(): Promise<User | null> {
  if (USE_FIREBASE) {
    const fbUser = getFirebaseAuth().currentUser;
    return fbUser ? firebaseUserToUser(fbUser) : null;
  }

  const sessionJson = localStorage.getItem('mockAuthSession');
  if (!sessionJson) return null;

  try {
    const session: AuthSession = JSON.parse(sessionJson);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('mockAuthSession');
      return null;
    }
    return session.user;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.roles.includes(role as any) || false;
}

/**
 * Check whether the current Firebase user's email has been verified.
 * Returns true in mock mode since no real verification is needed.
 */
export function isEmailVerified(): boolean {
  if (!USE_FIREBASE) return true;
  const fbUser = getFirebaseAuth().currentUser;
  return fbUser?.emailVerified ?? false;
}

/**
 * Re-send the email verification link for the current user.
 * Uses ActionCodeSettings that do not rely on Firebase Dynamic Links.
 */
export async function resendEmailVerification(): Promise<void> {
  if (!USE_FIREBASE) return;
  const fbUser = getFirebaseAuth().currentUser;
  if (!fbUser) throw new Error('No authenticated user');
  if (fbUser.emailVerified) return;
  await sendEmailVerification(fbUser, getActionCodeSettings());
}

/**
 * Sign in using a Firebase custom authentication token.
 * Used for Firebase Phone Number Verification (PNV) token exchange flow
 * where a backend endpoint validates the PNV token and returns a custom token.
 */
export async function signInWithCustomToken(customToken: string): Promise<User> {
  if (!USE_FIREBASE) {
    throw new Error('Custom token sign-in is only available with Firebase.');
  }
  const cred = await firebaseSignInWithCustomToken(getFirebaseAuth(), customToken);
  await saveUserProfileToFirestore(cred.user);
  const user = await enrichUserWithRoles(cred.user);
  notifyListeners(user);
  return user;
}

export async function refreshSession(): Promise<void> {
  if (USE_FIREBASE) return;
  const sessionJson = localStorage.getItem('mockAuthSession');
  if (!sessionJson) return;
  const session: AuthSession = JSON.parse(sessionJson);
  session.expiresAt = Date.now() + 3600000;
  localStorage.setItem('mockAuthSession', JSON.stringify(session));
}

/**
 * Session inactivity timeout.
 * Logs the user out after 1 hour of inactivity by default.
 * After logout, the next sign-in will require MFA verification again.
 */
const INACTIVITY_TIMEOUT_MS = Number(process.env.REACT_APP_SESSION_TIMEOUT_MS || 60 * 60 * 1000); // 1 hour default
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(async () => {
    const user = await getCurrentUser();
    if (user) {
      await logout();
      window.dispatchEvent(new CustomEvent('session-timeout'));
    }
  }, INACTIVITY_TIMEOUT_MS);
}

export function startSessionMonitor() {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
  resetInactivityTimer();
}

export function stopSessionMonitor() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
}
