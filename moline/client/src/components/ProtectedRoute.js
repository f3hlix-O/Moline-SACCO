import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthProvider";

const getStoredSession = (scope) => {
  try {
    const session = JSON.parse(localStorage.getItem(`${scope}Session`));
    return session && session.user ? session : null;
  } catch (error) {
    return null;
  }
};

const getFallbackSessionFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  try {
    const payload = jwtDecode(token);
    return {
      token,
      user: {
        user_id: payload.user_id,
        role_id: payload.role_id,
      },
    };
  } catch (error) {
    return null;
  }
};

const ProtectedRoute = ({
  allowedRoles,
  userRedirectPath = "/login",
  children,
}) => {
  const { token, user, isHydrated } = useAuth();
  const location = useLocation();
  const pathname = (location.pathname || "").toLowerCase();
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/reports");
  const fallbackSession =
    getStoredSession(isAdminRoute ? "admin" : "user") ||
    getStoredSession(isAdminRoute ? "user" : "admin") ||
    getFallbackSessionFromToken();
  const resolvedUser = user || fallbackSession?.user || null;
  const resolvedToken = token || fallbackSession?.token || null;

  if (!isHydrated) {
    return null;
  }

  if (!resolvedToken) {
    return <Navigate to={userRedirectPath} />;
  }

  const resolvedRoleId = Number(resolvedUser?.role_id);
  if (!resolvedUser || !allowedRoles.map(Number).includes(resolvedRoleId)) {
    return <Navigate to="/unauthorized" />;
  }

  if (children) {
    return children;
  }

  return <Outlet />;
};

export default ProtectedRoute;
