import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
  checkActionCode,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirebaseAuth } from '../../services/firebaseConfig';
import { Card } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import './auth-pages.css';

type ActionMode = 'resetPassword' | 'recoverEmail' | 'verifyEmail';

/**
 * Custom Email Action Handler
 * Handles Firebase email actions: password reset, email recovery, and email verification.
 * Replaces the default Firebase-hosted action handler so all flows stay within the app.
 */
export const EmailActionHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as ActionMode | null;
  const actionCode = searchParams.get('oobCode') || '';

  const [status, setStatus] = useState<'loading' | 'input' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mode || !actionCode) {
      setStatus('error');
      setMessage('Invalid action link. Please request a new one.');
      return;
    }

    const auth = getFirebaseAuth();

    switch (mode) {
      case 'resetPassword':
        verifyPasswordResetCode(auth, actionCode)
          .then((userEmail) => {
            setEmail(userEmail);
            setStatus('input');
          })
          .catch(() => {
            setStatus('error');
            setMessage('This password reset link has expired or is invalid. Please request a new one.');
          });
        break;

      case 'verifyEmail':
        applyActionCode(auth, actionCode)
          .then(() => {
            setStatus('success');
            setMessage('Your email address has been verified. You can now set up multi-factor authentication.');
          })
          .catch(() => {
            setStatus('error');
            setMessage('This verification link has expired or is invalid. Please request a new one.');
          });
        break;

      case 'recoverEmail':
        checkActionCode(auth, actionCode)
          .then((info) => {
            const restoredEmail = info.data.email || '';
            setEmail(restoredEmail);
            return applyActionCode(auth, actionCode).then(() => {
              setStatus('success');
              setMessage(`Your email has been restored to ${restoredEmail}.`);
              // Send a password reset for security
              if (restoredEmail) {
                sendPasswordResetEmail(auth, restoredEmail).catch((err) => {
                  console.error('Failed to send password reset after email recovery:', err);
                });
              }
            });
          })
          .catch(() => {
            setStatus('error');
            setMessage('This recovery link has expired or is invalid.');
          });
        break;

      default:
        setStatus('error');
        setMessage('Unknown action type.');
    }
  }, [mode, actionCode]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setMessage('Password must be at least 8 characters with one uppercase letter and one number.');
      return;
    }
    if (newPassword !== confirmPwd) {
      setMessage('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await confirmPasswordReset(getFirebaseAuth(), actionCode, newPassword);
      setStatus('success');
      setMessage('Your password has been reset successfully.');
    } catch {
      setStatus('error');
      setMessage('Failed to reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTitle = () => {
    switch (mode) {
      case 'resetPassword': return 'Reset Your Password';
      case 'verifyEmail': return 'Email Verification';
      case 'recoverEmail': return 'Email Recovery';
      default: return 'Account Action';
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" padding="lg" shadow="lg">
        <div className="create-account__header">
          <img src="/Logo.png" alt="Macha Group" className="create-account__logo" />
          <h2 className="create-account__title">{renderTitle()}</h2>
        </div>

        {status === 'loading' && (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Processing your request...</p>
        )}

        {status === 'error' && (
          <>
            <div className="create-account__error">{message}</div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/forgot-password">Request new reset link</Link>
              {' · '}
              <Link to="/login">Back to Sign In</Link>
            </div>
          </>
        )}

        {status === 'success' && (
          <div className="forgot-password__success">
            <div className="forgot-password__success-icon">✓</div>
            <h3>Done!</h3>
            <p>{message}</p>
            <Link to="/login">
              <Button fullWidth size="lg">Go to Sign In</Button>
            </Link>
          </div>
        )}

        {status === 'input' && mode === 'resetPassword' && (
          <form onSubmit={handlePasswordReset} className="create-account__form">
            <p style={{ textAlign: 'center', color: '#64748b', margin: 0, fontSize: '0.92rem' }}>
              Enter a new password for <strong>{email}</strong>
            </p>
            {message && <div className="create-account__error">{message}</div>}
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 chars, 1 upper, 1 number"
              required
              fullWidth
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Re-enter new password"
              required
              fullWidth
            />
            <Button type="submit" fullWidth loading={submitting} size="lg">
              Reset Password
            </Button>
            <p className="auth-links" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Link to="/login">Back to Sign In</Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
};

export default EmailActionHandler;
