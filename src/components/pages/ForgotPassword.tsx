import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { useAuth } from '../../hooks/useAuth';
import './auth-pages.css';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestReset } = useAuth();

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await requestReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" padding="lg" shadow="lg">
        <div className="create-account__header">
          <img src="/Logo.png" alt="Macha Group" className="create-account__logo" />
          <h2 className="create-account__title">Reset Password</h2>
          <p className="create-account__subtitle">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {error && <div className="create-account__error">{error}</div>}

        {sent ? (
          <div className="forgot-password__success">
            <div className="forgot-password__success-icon">✓</div>
            <h3>Check Your Email</h3>
            <p>Password reset instructions have been sent to <strong>{email}</strong>.</p>
            <p className="forgot-password__success-hint">Didn't receive it? Check your spam folder or try again.</p>
            <Button fullWidth size="lg" variant="secondary" onClick={() => setSent(false)}>
              Send Again
            </Button>
          </div>
        ) : (
          <form onSubmit={onReset} className="create-account__form">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
              fullWidth
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Send Reset Link
            </Button>
          </form>
        )}

        <p className="auth-links" style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/login">Back to Sign In</Link> · <Link to="/create-account">Create Account</Link>
        </p>
      </Card>
    </div>
  );
};

export default ForgotPassword;