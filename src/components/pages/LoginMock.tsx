import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // Error is handled by useAuth hook
    }
  };

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