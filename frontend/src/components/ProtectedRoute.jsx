import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UnauthorizedPage from '../pages/UnauthorizedPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <UnauthorizedPage />;
  }

  return children;
};

export default ProtectedRoute;
