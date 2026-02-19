import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../atoms/Card';
import { useAuth } from '../../hooks/useAuth';
import './auth-pages.css';

export const CreateAccount: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async () => {
    setError('');
    try {
      await register(name, email, password);
      navigate('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account');
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" padding="lg" shadow="lg">
        <h2>Create Account</h2>
        <p>Set up your organization profile to start assessments.</p>
        {error && <p className="error-note">{error}</p>}
        <label>Full Name<input value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="primary-btn" onClick={onSubmit} disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        <p className="auth-links">Already have an account? <Link to="/login">Sign in</Link></p>
      </Card>
    </div>
  );
};

export default CreateAccount;