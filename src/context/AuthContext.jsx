import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';

import { flushVisitedPages } from '../utils/routeTracker';

const AuthContext = createContext(null);

// Helper to inspect if token is expired or exceeded 24-hour lifetime
const isTokenExpiredOrExceeded24h = (jwtToken) => {
  if (!jwtToken) return true;
  try {
    const parts = jwtToken.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    const currentTimeSec = Math.floor(Date.now() / 1000);

    // If exp is in the past
    if (payload.exp && currentTimeSec >= payload.exp) {
      return true;
    }
    // If iat was more than 24 hours ago (86400 seconds)
    if (payload.iat && (currentTimeSec - payload.iat >= 24 * 60 * 60)) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    return stored && !isTokenExpiredOrExceeded24h(stored) ? stored : '';
  });
  const [loading, setLoading] = useState(true);

  // Restore user session on application load
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        // Enforce 24-hour session limit on client side immediately
        if (isTokenExpiredOrExceeded24h(storedToken)) {
          handleLogout();
          setLoading(false);
          return;
        }

        try {
          const res = await API.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.data.user);
            setToken(storedToken);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Session restoration failed:', error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // Periodically check if active session has exceeded 24 hours
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (isTokenExpiredOrExceeded24h(token)) {
        handleLogout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [token]);

  // Login handler
  const handleLogin = async (loginIdentifier, password) => {
    try {
      const res = await API.post('/auth/login', { loginIdentifier, password });
      if (res.data?.success) {
        const { token, data } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('session_login_time', Date.now().toString());
        setUser(data.user);
        setToken(token);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed.Please Try Again.'
      };
    }
  };

  // Registration handler
  const handleRegister = async (registrationData) => {
    try {
      const res = await API.post('/auth/register', registrationData);
      if (res.data?.success) {
        const { token, data } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('session_login_time', Date.now().toString());
        setUser(data.user);
        setToken(token);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  // Logout handler
  const handleLogout = () => {
    try {
      flushVisitedPages(true);
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('session_login_time');
    sessionStorage.removeItem('session_tracked_pages');
    setUser(null);
    setToken('');
  };

  // Update profile details helper
  const updateUserData = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateUser: updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
