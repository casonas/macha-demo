import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './AuthGuard.css';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ('admin' | 'user' | 'manager')[];
}

/**
 * AuthGuard Component
 * Protects routes by checking authentication status
 * Redirects to login if not authenticated
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