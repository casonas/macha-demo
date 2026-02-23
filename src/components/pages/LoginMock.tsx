import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MfaRequiredError, completeMfaLogin } from '../../services/auth/authService';
import {
  initRecaptcha,
  startMfaSignIn,
  completeMfaSignIn
} from '../../services/auth/mfaService';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Card } from '../atoms/Card';
import './LoginMock.css';

/**
 * Mock Login Page
 * Demonstrates authentication flow with new components
 * Credentials:
 * - admin@machagroup.com / admin123 (Admin role)
 * - user@school.edu / user123 (User role)
 */
export const LoginMock: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaVerificationId, setMfaVerificationId] = useState('');
  const [mfaResolver, setMfaResolver] = useState<any>(null);
  const [mfaPendingUser, setMfaPendingUser] = useState<any>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const from = (location.state as any)?.from?.pathname || '/home';

  useEffect(() => {
    if (mfaStep && recaptchaRef.current) {
      initRecaptcha('login-recaptcha-container');
    }
  }, [mfaStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        setMfaResolver(err.resolver);
        setMfaPendingUser(err.pendingUser);
        setMfaError('');
        setMfaCode('');
        setMfaStep(true);

        // Automatically send the verification code
        try {
          setMfaLoading(true);
          const vid = await startMfaSignIn(err.resolver);
          setMfaVerificationId(vid);
        } catch (sendErr) {
          setMfaError(sendErr instanceof Error ? sendErr.message : 'Failed to send verification code');
        } finally {
          setMfaLoading(false);
        }
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
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        setMfaResolver(err.resolver);
        setMfaPendingUser(err.pendingUser);
        setMfaError('');
        setMfaCode('');
        setMfaStep(true);

        try {
          setMfaLoading(true);
          const vid = await startMfaSignIn(err.resolver);
          setMfaVerificationId(vid);
        } catch (sendErr) {
          setMfaError(sendErr instanceof Error ? sendErr.message : 'Failed to send verification code');
        } finally {
          setMfaLoading(false);
        }
      }
      // Other errors handled by useAuth hook
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
        </form>

        <div className="login-mock__demo">
          <h3>Demo Credentials</h3>
          <div className="login-mock__credentials">
            <div className="credential">
              <strong>Admin:</strong> admin@machagroup.com / admin123
            </div>
            <div className="credential">
              <strong>User:</strong> user@school.edu / user123
            </div>
          </div>
          <p className="auth-links" style={{ marginTop: '0.7rem' }}>
            <Link to="/create-account">Create account</Link> · <Link to="/forgot-password">Forgot password</Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginMock;