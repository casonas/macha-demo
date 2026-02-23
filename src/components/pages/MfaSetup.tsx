import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { useAuth } from '../../hooks/useAuth';
import {
  initRecaptcha,
  isMfaEnrolled,
  startMfaEnrollment,
  completeMfaEnrollment,
} from '../../services/auth/mfaService';
import { getProfile } from '../../services/data';
import './auth-pages.css';

/**
 * MFA Setup Page
 * Shown after login or registration when MFA is not yet enrolled.
 * Users must verify their phone number before accessing the app.
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
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isMfaEnrolled()) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (recaptchaRef.current) {
      initRecaptcha('mfa-setup-recaptcha');
    }
  }, [step]);

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
          <h2 className="create-account__title">Verify Your Phone</h2>
          <p className="create-account__subtitle">
            {step === 'phone'
              ? 'Multi-factor authentication is required. Verify your phone number to secure your account.'
              : 'Enter the 6-digit code sent to your phone.'}
          </p>
        </div>

        {/* Recaptcha container (invisible) */}
        <div id="mfa-setup-recaptcha" ref={recaptchaRef} />

        {error && <div className="create-account__error">{error}</div>}

        {step === 'phone' ? (
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
        ) : (
          <form onSubmit={handleVerify} className="create-account__form">
            <p style={{ fontSize: '0.9rem', color: '#475569', textAlign: 'center', margin: 0 }}>
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
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginTop: '1rem' }}>
            Signed in as {user.email}
          </p>
        )}
      </Card>
    </div>
  );
};

export default MfaSetup;
