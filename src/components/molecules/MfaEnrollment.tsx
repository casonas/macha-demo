import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import {
  initRecaptcha,
  isMfaEnrolled,
  startMfaEnrollment,
  completeMfaEnrollment,
  unenrollMfa
} from '../../services/auth/mfaService';

interface MfaEnrollmentProps {
  userPhone?: string;
}

type Step = 'idle' | 'phone' | 'verify' | 'done';

export const MfaEnrollment: React.FC<MfaEnrollmentProps> = ({ userPhone }) => {
  const [enrolled, setEnrolled] = useState(isMfaEnrolled());
  const [step, setStep] = useState<Step>('idle');
  const [phone, setPhone] = useState(() => {
    const p = userPhone || '';
    return p.startsWith('+1') ? p.slice(2) : p;
  });
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recaptchaRef.current) {
      initRecaptcha('mfa-recaptcha-container');
    }
  }, [step]);

  const handleStartEnrollment = useCallback(async () => {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleVerify = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await completeMfaEnrollment(verificationId, code.trim());
      setEnrolled(true);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  }, [code, verificationId]);

  const handleUnenroll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await unenrollMfa();
      setEnrolled(false);
      setStep('idle');
      setCode('');
      setVerificationId('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 w-full flex flex-col items-center">
      <h3 className="text-lg font-bold text-slate-900 mb-2">SMS Multi-Factor Authentication</h3>
      <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
        Add an extra layer of security to your account by enabling SMS verification during sign-in.
      </p>

      {/* Recaptcha container (invisible) */}
      <div id="mfa-recaptcha-container" ref={recaptchaRef} />

      {error && (
        <div className="w-full max-w-md rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4 text-center">
          {error}
        </div>
      )}

      {enrolled && step !== 'done' && step !== 'phone' && step !== 'verify' ? (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-4 py-2 mb-4">
            ✅ MFA Enabled
          </span>
          <p className="text-sm text-slate-500 mb-4">
            SMS verification is active on your account.
          </p>
          <Button variant="danger" size="sm" onClick={handleUnenroll} loading={loading}>
            Disable MFA
          </Button>
        </div>
      ) : step === 'idle' ? (
        <Button size="sm" onClick={() => setStep('phone')} loading={loading}>
          🔐 Enable SMS MFA
        </Button>
      ) : step === 'phone' ? (
        <div className="w-full max-w-md space-y-4">
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            fullWidth
          />
          <p className="text-xs text-slate-400">
            Enter your 10-digit US phone number. +1 is added automatically.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" size="sm" onClick={() => { setStep('idle'); setError(''); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleStartEnrollment} loading={loading}>
              Send Code
            </Button>
          </div>
        </div>
      ) : step === 'verify' ? (
        <div className="w-full max-w-md space-y-4">
          <p className="text-sm text-slate-600 text-center">
            A verification code has been sent to <strong>+1 {phone}</strong>.
          </p>
          <Input
            label="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            fullWidth
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" size="sm" onClick={() => { setStep('phone'); setError(''); }}>
              Back
            </Button>
            <Button size="sm" onClick={handleVerify} loading={loading}>
              Verify &amp; Enable
            </Button>
          </div>
        </div>
      ) : step === 'done' ? (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-4 py-2 mb-4">
            ✅ MFA Enabled Successfully
          </span>
          <p className="text-sm text-slate-500 mb-4">
            You will now be asked for a verification code when signing in.
          </p>
          <Button variant="danger" size="sm" onClick={handleUnenroll} loading={loading}>
            Disable MFA
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default MfaEnrollment;
