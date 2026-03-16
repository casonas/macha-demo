import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MfaRequiredError, completeMfaLogin, signInWithCustomToken } from '../../services/auth/authService';
import { getFirebaseAuth } from '../../services/firebaseConfig';
import {
  initRecaptcha,
  isMfaEnrolled,
  startMfaSignIn,
  completeMfaSignIn
} from '../../services/auth/mfaService';
import {
  preAuthCheck,
  sessionLogin,
  loginWithWebAuthn,
} from '../../services/auth/securitySessionService';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Card } from '../atoms/Card';
import './LoginMock.css';

const PASSKEY_ENABLED = process.env.REACT_APP_ENABLE_PASSKEY === 'true';

/**
 * Login Page
 * Handles authentication flow with email/password and Google sign-in.
 * Supports MFA verification when enabled.
 */
export const LoginMock: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [preAuthMessage, setPreAuthMessage] = useState('');

  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaVerificationId, setMfaVerificationId] = useState('');
  const [mfaResolver, setMfaResolver] = useState<any>(null);
  const [mfaPendingUser, setMfaPendingUser] = useState<any>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const recaptchaRef = useRef<HTMLDivElement>(null);
  // Tracks whether the SMS code has already been sent for the current MFA session.
  const mfaSmsSentRef = useRef(false);

  const from = (location.state as any)?.from?.pathname || '/home';

  const finalizeServerSession = async (sourceLabel: string) => {
    const fbUser = getFirebaseAuth().currentUser;
    if (!fbUser) return;
    try {
      const idToken = await fbUser.getIdToken();
      await sessionLogin({
        idToken,
        rememberDevice,
        label: sourceLabel,
      });
    } catch (err) {
      console.warn('Server session bootstrap failed, keeping Firebase client session only:', err);
    }
  };

  // When the MFA view is shown, the login-form DOM is replaced, so the
  // RecaptchaVerifier must be (re-)initialized against the new element that is
  // now in the DOM.  We do this in an effect (runs after paint) to guarantee
  // the new element exists before calling Firebase.
  useEffect(() => {
    if (mfaStep && mfaResolver && !mfaSmsSentRef.current) {
      mfaSmsSentRef.current = true;
      initRecaptcha('login-recaptcha-container');
      setMfaLoading(true);
      startMfaSignIn(mfaResolver)
        .then(vid => setMfaVerificationId(vid))
        .catch(err => setMfaError(err instanceof Error ? err.message : 'Failed to send verification code'))
        .finally(() => setMfaLoading(false));
    }
    // Reset the sent-flag when the user goes back to the login form so that
    // a subsequent MFA challenge will send a fresh SMS code.
    if (!mfaStep) {
      mfaSmsSentRef.current = false;
    }
  }, [mfaStep, mfaResolver]);

  useEffect(() => {
    let cancelled = false;
    const checkPasskeySupport = async () => {
      if (!PASSKEY_ENABLED || typeof PublicKeyCredential === 'undefined') {
        if (!cancelled) setPasskeySupported(false);
        return;
      }
      try {
        const canUsePlatformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!cancelled) setPasskeySupported(canUsePlatformAuthenticator);
      } catch {
        if (!cancelled) setPasskeySupported(false);
      }
    };
    void checkPasskeySupport();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setPreAuthMessage('');
      if (email.trim()) {
        const pre = await preAuthCheck(email.trim());
        if (pre.trusted && !pre.requireMfa) {
          setPreAuthMessage('Trusted device recognized. You may not need another MFA challenge.');
        } else if (pre.requireRecaptcha) {
          setPreAuthMessage('Additional anti-abuse checks may be required for this sign-in.');
        }
      }
      await login(email, password);
      await finalizeServerSession('email-password');
      // Successful login without MFA challenge — user either has no MFA
      // enrolled or Firebase did not require a second factor.
      // If MFA is not enrolled, redirect to MFA setup for first-time enrollment.
      // If MFA is enrolled, go directly to the destination (returning user).
      if (!isMfaEnrolled()) {
        navigate('/mfa-setup', { replace: true });
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        // Returning user with MFA enrolled — Firebase requires second factor.
        // Show the MFA verification screen; the useEffect will reinitialize
        // reCAPTCHA on the newly-rendered element and send the SMS code.
        setMfaResolver(err.resolver);
        setMfaPendingUser(err.pendingUser);
        setMfaError('');
        setMfaCode('');
        setMfaStep(true);
      }
      // Other errors handled by useAuth hook
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) {
      setMfaError('Please enter the verification code.');
      return;
    }
    setMfaError('');
    setMfaLoading(true);
    try {
      await completeMfaSignIn(mfaResolver, mfaVerificationId, mfaCode.trim());
      // For mock mode, complete the login with the pending user
      if (mfaPendingUser) {
        completeMfaLogin(mfaPendingUser);
      }
      await finalizeServerSession('mfa');
      navigate(from, { replace: true });
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaStep(false);
    setMfaCode('');
    setMfaVerificationId('');
    setMfaResolver(null);
    setMfaPendingUser(null);
    setMfaError('');
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      await finalizeServerSession('google-oauth');
      // If MFA is not enrolled, redirect to MFA setup for first-time enrollment.
      if (!isMfaEnrolled()) {
        navigate('/mfa-setup', { replace: true });
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        // Returning user with MFA enrolled — show verification screen.
        // The useEffect will reinitialize reCAPTCHA and send the SMS code.
        setMfaResolver(err.resolver);
        setMfaPendingUser(err.pendingUser);
        setMfaError('');
        setMfaCode('');
        setMfaStep(true);
      }
      // Other errors handled by useAuth hook
    }
  };

  const handlePasskeySignIn = async () => {
    setPasskeyMessage('');
    setPasskeyLoading(true);
    try {
      const result = await loginWithWebAuthn(email.trim() || undefined, rememberDevice);
      await signInWithCustomToken(result.customToken);
      await finalizeServerSession('webauthn-passkey');
      navigate(from, { replace: true });
      return;
    } catch (err) {
      setPasskeyMessage(err instanceof Error ? err.message : 'Passkey sign-in failed.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  // MFA Verification Screen
  if (mfaStep) {
    return (
      <div className="login-mock">
        <Card className="login-mock__card" padding="lg" shadow="lg">
          <div className="login-mock__header">
            <img src="/Logo.png" alt="Macha Group" style={{ width: 70, height: 56, margin: '0 auto 0.7rem' }} />
            <h1 className="login-mock__title">Verification Required</h1>
            <p className="login-mock__subtitle">
              A verification code has been sent to your phone via SMS.
            </p>
          </div>

          {/* Recaptcha container (invisible) */}
          <div id="login-recaptcha-container" ref={recaptchaRef} />

          <form onSubmit={handleMfaVerify} className="login-mock__form">
            {mfaError && (
              <div className="login-mock__error">
                {mfaError}
              </div>
            )}

            <Input
              type="text"
              label="Verification Code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              fullWidth
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#334155' }}>
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
              />
              Remember this device for 24 hours
            </label>

            <Button
              type="submit"
              fullWidth
              loading={mfaLoading}
              size="lg"
            >
              Verify &amp; Sign In
            </Button>

            <Button
              type="button"
              fullWidth
              size="lg"
              variant="secondary"
              onClick={handleBackToLogin}
              disabled={mfaLoading}
            >
              Back to Login
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="login-mock">
      <Card className="login-mock__card" padding="lg" shadow="lg">
        <div className="login-mock__header">
          <img src="/Logo.png" alt="Macha Group" style={{ width: 70, height: 56, margin: '0 auto 0.7rem' }} />
          <h1 className="login-mock__title">Macha Group Security</h1>
          <p className="login-mock__subtitle">Sign in to access assessments</p>
        </div>

        <form onSubmit={handleSubmit} className="login-mock__form">
          {error && (
            <div className="login-mock__error">
              {error}
            </div>
          )}

          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            fullWidth
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            fullWidth
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#334155' }}>
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            Remember this device for 24 hours
          </label>

          {preAuthMessage && (
            <p className="login-mock__hint">{preAuthMessage}</p>
          )}

          <Button 
            type="submit" 
            fullWidth 
            loading={loading}
            size="lg"
          >
            Sign In
          </Button>

          <div className="login-mock__divider" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>or</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
          </div>

          <Button
            type="button"
            fullWidth
            size="lg"
            variant="secondary"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Sign in with Google
            </span>
          </Button>

          {PASSKEY_ENABLED && passkeySupported && (
            <Button
              type="button"
              fullWidth
              size="lg"
              variant="secondary"
              onClick={handlePasskeySignIn}
              loading={passkeyLoading}
              disabled={loading || passkeyLoading}
            >
              Sign in with Passkey (Optional)
            </Button>
          )}

          {passkeyMessage && <p className="login-mock__hint">{passkeyMessage}</p>}
        </form>

        {/* Recaptcha container (invisible) — always in DOM for MFA readiness */}
        <div id="login-recaptcha-container" ref={recaptchaRef} />

        <div className="login-mock__footer">
          <p className="auth-links" style={{ marginTop: '0.7rem' }}>
            <Link to="/create-account">Create account</Link> · <Link to="/forgot-password">Forgot password</Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginMock;
