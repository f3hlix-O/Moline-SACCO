import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import axiosInstance from './axiosInstance';
import { jwtDecode } from "jwt-decode"

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(Cookies.get('token'));

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      localStorage.setItem('token', token);
      try {
        const decoded = jwtDecode(token);
        const userData = ({ user_id: decoded.user_id, role_id: decoded.role_id });
        setUser(userData);
      } catch (error) {
        console.error('Invalid token:', error);
        Cookies.remove('token');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    }
  }, [token]);

  const login = (token) => {
    setToken(token);
    Cookies.set('token', token, { secure: true, sameSite: 'Strict' });

    try {
      const decoded = jwtDecode(token);
      const userData = { user_id: decoded.user_id, role_id: decoded.role_id };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Cookies.remove('token');
    console.log('User data on logout:', user);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
