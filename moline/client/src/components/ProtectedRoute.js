import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const ProtectedRoute = ({ allowedRoles, userRedirectPath = '/login', children }) => {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to={userRedirectPath} />;
  }

  if (!allowedRoles.includes(user.role_id)) {
    return <Navigate to="/unauthorized" />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
