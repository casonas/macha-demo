/**
 * SMS Multi-Factor Authentication Service
 * Uses Firebase Phone Auth for SMS-based MFA enrollment and verification.
 * When running in mock mode, simulates the MFA flow for development.
 */

import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  type MultiFactorResolver
} from 'firebase/auth';
import { getFirebaseAuth } from '../firebaseConfig';

const USE_FIREBASE = (process.env.REACT_APP_DATA_PROVIDER || 'firebase') === 'firebase';

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize a RecaptchaVerifier on a given DOM element.
 * Must be called before enrollment or sign-in verification.
 */
export function initRecaptcha(elementId: string): RecaptchaVerifier | null {
  if (!USE_FIREBASE) return null;
  recaptchaVerifier = new RecaptchaVerifier(getFirebaseAuth(), elementId, { size: 'invisible' });
  return recaptchaVerifier;
}

/**
 * Check if current user has enrolled MFA.
 */
export function isMfaEnrolled(): boolean {
  if (!USE_FIREBASE) {
    return localStorage.getItem('macha.mfaEnrolled') === 'true';
  }
  const user = getFirebaseAuth().currentUser;
  if (!user) return false;
  return multiFactor(user).enrolledFactors.length > 0;
}

/**
 * Start MFA enrollment: sends verification SMS to the phone number.
 * Returns a verificationId needed to complete enrollment.
 */
export async function startMfaEnrollment(phoneNumber: string): Promise<string> {
  if (!USE_FIREBASE) {
    // Mock: simulate sending SMS
    await new Promise(r => setTimeout(r, 800));
    localStorage.setItem('macha.mfaPending', phoneNumber);
    return 'mock-verification-id';
  }

  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('No authenticated user');

  if (!recaptchaVerifier) throw new Error('Recaptcha not initialized. Call initRecaptcha() first.');

  const session = await multiFactor(user).getSession();
  const phoneInfoOptions = { phoneNumber, session };
  const phoneAuthProvider = new PhoneAuthProvider(getFirebaseAuth());
  return phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
}

/**
 * Complete MFA enrollment with the SMS code the user received.
 */
export async function completeMfaEnrollment(verificationId: string, smsCode: string): Promise<void> {
  if (!USE_FIREBASE) {
    await new Promise(r => setTimeout(r, 500));
    if (smsCode.length < 4) throw new Error('Invalid verification code');
    localStorage.setItem('macha.mfaEnrolled', 'true');
    localStorage.removeItem('macha.mfaPending');
    return;
  }

  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('No authenticated user');

  const cred = PhoneAuthProvider.credential(verificationId, smsCode);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  await multiFactor(user).enroll(assertion, 'Phone Number');
}

/**
 * Resolve a multi-factor sign-in challenge.
 * Called when login throws `auth/multi-factor-auth-required`.
 */
export async function startMfaSignIn(resolver: MultiFactorResolver): Promise<string> {
  if (!recaptchaVerifier) throw new Error('Recaptcha not initialized.');

  const phoneInfoOptions = {
    multiFactorHint: resolver.hints[0],
    session: resolver.session
  };
  const phoneAuthProvider = new PhoneAuthProvider(getFirebaseAuth());
  return phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
}

/**
 * Complete multi-factor sign-in with the SMS code.
 */
export async function completeMfaSignIn(
  resolver: MultiFactorResolver,
  verificationId: string,
  smsCode: string
): Promise<void> {
  const cred = PhoneAuthProvider.credential(verificationId, smsCode);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  await resolver.resolveSignIn(assertion);
}

/**
 * Unenroll MFA (remove all enrolled factors).
 */
export async function unenrollMfa(): Promise<void> {
  if (!USE_FIREBASE) {
    localStorage.removeItem('macha.mfaEnrolled');
    return;
  }

  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('No authenticated user');

  const factors = multiFactor(user).enrolledFactors;
  for (const factor of factors) {
    await multiFactor(user).unenroll(factor);
  }
}
