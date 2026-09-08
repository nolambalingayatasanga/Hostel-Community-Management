import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Restore user session on application load
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
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

  // Login handler
  const handleLogin = async (loginIdentifier, password) => {
    try {
      const res = await API.post('/auth/login', { loginIdentifier, password });
      if (res.data?.success) {
        const { token, data } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setToken(token);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.'
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
