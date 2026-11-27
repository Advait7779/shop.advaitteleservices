import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);

  // Shared customer sign-in modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onLoginSuccessCallback, setOnLoginSuccessCallback] = useState(null);

  useEffect(() => {
    const handleExpired = () => {
      generation.current += 1;
      setUser(null);
    };
    window.addEventListener('advait-customer-session-expired', handleExpired);
    return () => window.removeEventListener('advait-customer-session-expired', handleExpired);
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    const initial = generation.current;
    api.get('/auth/me', { signal: abort.signal, skipSessionExpiry: true }).then(({ data }) => {
      if (!abort.signal.aborted && initial === generation.current) setUser(data.user);
    }).catch(() => {}).finally(() => {
      if (!abort.signal.aborted) setLoading(false);
    });
    return () => abort.abort();
  }, []);

  const openAuthModal = (callback = null) => {
    setOnLoginSuccessCallback(() => callback);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setOnLoginSuccessCallback(null);
  };

  const loginWithOtpResult = (userData) => {
    generation.current += 1;
    setUser(userData);
    setAuthModalOpen(false);

    // Complete any action queued before sign-in.
    if (onLoginSuccessCallback && typeof onLoginSuccessCallback === 'function') {
      try {
        onLoginSuccessCallback(userData);
      } catch (err) {
        console.error('Error executing queued action after login:', err);
      }
      setOnLoginSuccessCallback(null);
    }
  };

  const logout = async () => {
    await api.post('/auth/logout');
    generation.current += 1;
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const initial = generation.current;
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data.success && initial === generation.current) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: 'Your session changed. Please try again.' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        authModalOpen,
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
