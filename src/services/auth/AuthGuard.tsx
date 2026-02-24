import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isMfaEnrolled } from '../auth/mfaService';
import './AuthGuard.css';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ('admin' | 'user' | 'manager')[];
}

/**
 * AuthGuard Component
 * Protects routes by checking authentication status.
 *
 * MFA flow for returning users:
 *   - If MFA is already enrolled, the user proved their identity during
 *     sign-in (Firebase enforces the second factor at login time).
 *     They are NOT redirected to MFA setup again.
 *   - If MFA is NOT enrolled AND the user's email is verified, they are
 *     redirected to /mfa-setup to complete one-time enrollment.
 *   - If MFA is NOT enrolled AND the user's email is NOT verified, they
 *     are redirected to /mfa-setup which shows the email verification step.
 *   - MFA verification is only required once per session. After the
 *     1-hour inactivity timeout the user is logged out and must
 *     re-authenticate with MFA on the next sign-in.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRoles 
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-guard__loading">
        <div className="auth-guard__spinner" />
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, saving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only redirect to MFA setup if the user has NOT yet enrolled MFA.
  // Returning users who already have MFA enrolled completed their MFA
  // challenge during sign-in — no need to redirect them again.
  if (!isMfaEnrolled()) {
    return <Navigate to="/mfa-setup" replace />;
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      user?.roles.includes(role)
    );
    
    if (!hasRequiredRole) {
      return (
        <div className="auth-guard__unauthorized">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default AuthGuard;