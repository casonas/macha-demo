import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { useAuth } from '../../hooks/useAuth';
import {
  isEmailVerified,
  resendEmailVerification,
} from '../../services/auth/authService';
import {
  initRecaptcha,
  isMfaEnrolled,
  startMfaEnrollment,
  completeMfaEnrollment,
} from '../../services/auth/mfaService';
import { getFirebaseAuth } from '../../services/firebaseConfig';
import { getProfile } from '../../services/data';
import './auth-pages.css';

const USE_FIREBASE = (process.env.REACT_APP_DATA_PROVIDER || 'firebase') === 'firebase';

/**
 * MFA Setup Page
 * Shown after login or registration when MFA is not yet enrolled.
 * Users must verify their email first (Firebase requirement), then verify
 * their phone number before accessing the app.
 *
 * Returning user flow:
 *   1. User logs in → AuthGuard redirects here if MFA is not enrolled
 *   2. If email is NOT verified → shows email verification prompt with resend button
 *   3. User clicks link in email → comes back and clicks "I've verified my email"
 *   4. Page reloads the Firebase user to pick up emailVerified = true
 *   5. Phone number entry and SMS verification proceed normally
 */
export const MfaSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profile = getProfile();
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const [phone, setPhone] = useState(() => {
    const p = profile.phone || '';
    return p.startsWith('+1') ? p.slice(2) : p;
  });
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [step, setStep] = useState<'email-verify' | 'phone' | 'verify'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Check email verification status and MFA enrollment on mount
  useEffect(() => {
    if (isMfaEnrolled()) {
      navigate('/home', { replace: true });
      return;
    }
    // If email is not verified, show the email verification step first
    if (!isEmailVerified()) {
      setStep('email-verify');
    }
  }, [navigate]);

  useEffect(() => {
    if (step === 'phone' && recaptchaRef.current) {
      initRecaptcha('mfa-setup-recaptcha');
    }
  }, [step]);

  /**
   * Reload the Firebase user object to pick up changes to emailVerified.
   * Called after the user clicks the verification link in their email.
   */
  const handleCheckVerification = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      if (USE_FIREBASE) {
        const fbUser = getFirebaseAuth().currentUser;
        if (fbUser) {
          await fbUser.reload();
        }
      }
      if (isEmailVerified()) {
        setStep('phone');
      } else {
        setError('Your email is not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check verification status');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResendVerification = async () => {
    setError('');
    setLoading(true);
    try {
      await resendEmailVerification();
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.trim().replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const vid = await startMfaEnrollment(`+1${digits}`);
      setVerificationId(vid);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await completeMfaEnrollment(verificationId, code.trim());
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" padding="lg" shadow="lg">
        <div className="create-account__header">
          <img src="/Logo.png" alt="Macha Group" className="create-account__logo" />
          <h2 className="create-account__title">
            {step === 'email-verify' ? 'Verify Your Email' : 'Verify Your Phone'}
          </h2>
          <p className="create-account__subtitle">
            {step === 'email-verify'
              ? 'You must verify your email address before setting up multi-factor authentication.'
              : step === 'phone'
                ? 'Multi-factor authentication is required. Verify your phone number to secure your account.'
                : 'Enter the 6-digit code sent to your phone.'}
          </p>
        </div>

        {/* Recaptcha container (invisible) */}
        <div id="mfa-setup-recaptcha" ref={recaptchaRef} />

        {error && <div className="create-account__error">{error}</div>}

        {/* Step 1: Email verification (shown if email is not yet verified) */}
        {step === 'email-verify' && (
          <div className="create-account__form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {emailSent ? (
              <div className="forgot-password__success">
                <div className="forgot-password__success-icon">✉</div>
                <h3>Check Your Inbox</h3>
                <p>
                  A verification email has been sent to <strong>{user?.email}</strong>.
                  Click the link in the email, then come back and press the button below.
                </p>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
                A verification email was sent when you created your account.
                If you didn't receive it, click the button below to resend.
              </p>
            )}
            <Button
              type="button"
              fullWidth
              loading={loading}
              size="lg"
              onClick={handleCheckVerification}
            >
              I've Verified My Email
            </Button>
            <Button
              type="button"
              fullWidth
              size="lg"
              variant="secondary"
              onClick={handleResendVerification}
              disabled={loading}
            >
              Resend Verification Email
            </Button>
          </div>
        )}

        {/* Step 2: Phone number entry */}
        {step === 'phone' && (
          <form onSubmit={handleSendCode} className="create-account__form">
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              helperText="US number — +1 is added automatically"
              required
              fullWidth
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Send Verification Code
            </Button>
          </form>
        )}

        {/* Step 3: SMS code verification */}
        {step === 'verify' && (
          <form onSubmit={handleVerify} className="create-account__form">
            <p className="text-sm text-slate-500 text-center m-0">
              Code sent to <strong>+1 {phone}</strong>
            </p>
            <Input
              label="Verification Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              fullWidth
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Verify &amp; Continue
            </Button>
            <Button
              type="button"
              fullWidth
              size="lg"
              variant="secondary"
              onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              disabled={loading}
            >
              Change Phone Number
            </Button>
          </form>
        )}

        {user && (
          <p className="text-xs text-slate-400 text-center mt-4">
            Signed in as {user.email}
          </p>
        )}
      </Card>
    </div>
  );
};

export default MfaSetup;
