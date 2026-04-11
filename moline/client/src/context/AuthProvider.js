import React, { createContext, useState, useContext, useEffect } from "react";
import axiosInstance from "./axiosInstance";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

const getSessionScopeFromPath = () => {
  const pathname = (window.location.pathname || "").toLowerCase();
  if (pathname.startsWith("/admin") || pathname.startsWith("/reports")) {
    return "admin";
  }

  return "user";
};

const getStoredSession = (scope) => {
  try {
    const session = JSON.parse(localStorage.getItem(`${scope}Session`));
    return session && session.token ? session : null;
  } catch (error) {
    return null;
  }
};

const buildSessionFromToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);
    return {
      token,
      user: {
        user_id: decoded.user_id,
        role_id: decoded.role_id,
      },
    };
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const initialScope = getSessionScopeFromPath();
  const initialSession =
    getStoredSession(initialScope) ||
    getStoredSession(initialScope === "admin" ? "user" : "admin") ||
    buildSessionFromToken(localStorage.getItem("token"));
  const [activeScope, setActiveScope] = useState(initialScope);
  const [user, setUser] = useState(initialSession?.user || null);
  const [token, setToken] = useState(initialSession?.token || null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const syncSessionForPath = () => {
      const nextScope = getSessionScopeFromPath();
      const session =
        getStoredSession(nextScope) ||
        getStoredSession(nextScope === "admin" ? "user" : "admin") ||
        buildSessionFromToken(localStorage.getItem("token"));

      setActiveScope(nextScope);

      if (!session?.token) {
        delete axiosInstance.defaults.headers.common["Authorization"];
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
        setIsHydrated(true);
        return;
      }

      try {
        const decoded = jwtDecode(session.token);
        const userData = {
          ...(session.user || {}),
          user_id: session.user?.user_id || decoded.user_id,
          role_id:
            session.user?.role_id !== undefined &&
            session.user?.role_id !== null
              ? session.user.role_id
              : decoded.role_id,
        };

        axiosInstance.defaults.headers.common["Authorization"] =
          "Bearer " + session.token;
        localStorage.setItem("token", session.token);
        setUser(userData);
        setToken(session.token);
        setIsHydrated(true);
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem(`${nextScope}Session`);
        setUser(null);
        setToken(null);
        setIsHydrated(true);
      }
    };

    const notifyLocationChange = () => syncSessionForPath();
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    window.addEventListener("popstate", notifyLocationChange);
    window.addEventListener("locationchange", notifyLocationChange);

    syncSessionForPath();

    return () => {
      window.removeEventListener("popstate", notifyLocationChange);
      window.removeEventListener("locationchange", notifyLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const login = (token, profile = null, scope = "user") => {
    const nextScope = scope === "admin" ? "admin" : "user";
    setActiveScope(nextScope);
    setToken(token);

    try {
      const decoded = jwtDecode(token);
      const userData = {
        ...(profile || {}),
        user_id: profile?.user_id || decoded.user_id,
        role_id:
          profile?.role_id !== undefined && profile?.role_id !== null
            ? profile.role_id
            : decoded.role_id,
      };
      setUser(userData);
      localStorage.setItem(
        `${nextScope}Session`,
        JSON.stringify({ token, user: userData }),
      );
      localStorage.setItem("token", token);
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveScope(getSessionScopeFromPath());
    setIsHydrated(true);
    localStorage.removeItem("token");
    localStorage.removeItem("userSession");
    localStorage.removeItem("adminSession");
    console.log("User data on logout:", user);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isHydrated, activeScope }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
