import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../atoms/Card';
import { useAuth } from '../../hooks/useAuth';
import './auth-pages.css';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { requestReset } = useAuth();

  const onReset = async () => {
    await requestReset(email);
    setSent(true);
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" padding="lg" shadow="lg">
        <h2>Forgot Password</h2>
        <p>We will send a reset link to your registered email.</p>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} /></label>
        <button className="primary-btn" onClick={onReset}>Send Reset Link</button>
        {sent && <p className="ok-note">Reset instructions sent.</p>}
        <p className="auth-links"><Link to="/login">Back to Sign in</Link></p>
      </Card>
    </div>
  );
};

export default ForgotPassword;