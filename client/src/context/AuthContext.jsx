import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('advait_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('advait_auth_token'));
  const [loading, setLoading] = useState(true);

  // Modal State for On-Demand Login on Add to Cart
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [onLoginSuccessCallback, setOnLoginSuccessCallback] = useState(null);

  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('advait-customer-session-expired', handleExpired);
    return () => window.removeEventListener('advait-customer-session-expired', handleExpired);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('advait_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Failed to verify session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const openAuthModal = (callback = null, mode = 'login') => {
    setOnLoginSuccessCallback(() => callback);
    setAuthModalMode(mode === 'register' ? 'register' : 'login');
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setOnLoginSuccessCallback(null);
  };

  const loginWithOtpResult = (authToken, userData) => {
    localStorage.setItem('advait_auth_token', authToken);
    localStorage.setItem('advait_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    setAuthModalOpen(false);

    // If an action was queued (e.g., adding to cart), execute it now
    if (onLoginSuccessCallback && typeof onLoginSuccessCallback === 'function') {
      try {
        onLoginSuccessCallback(userData);
      } catch (err) {
        console.error('Error executing queued action after login:', err);
      }
      setOnLoginSuccessCallback(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('advait_auth_token');
    localStorage.removeItem('advait_user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('advait_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        loginWithOtpResult,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
