import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('advait_admin_token') || null);
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('advait_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleExpired = () => {
      setAdminToken(null);
      setAdminUser(null);
      localStorage.removeItem('advait_admin_token');
      localStorage.removeItem('advait_admin_user');
    };
    window.addEventListener('advait-admin-session-expired', handleExpired);
    return () => window.removeEventListener('advait-admin-session-expired', handleExpired);
  }, []);

  // Validate session on load
  useEffect(() => {
    if (adminToken) {
      api
        .get('/admin/auth/me', {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        .then((res) => {
          if (res.data.success) {
            setAdminUser(res.data.admin);
            localStorage.setItem('advait_admin_user', JSON.stringify(res.data.admin));
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [adminToken]);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/admin/auth/login', { identifier, password });
      if (res.data.success) {
        const { token, admin } = res.data;
        setAdminToken(token);
        setAdminUser(admin);
        localStorage.setItem('advait_admin_token', token);
        localStorage.setItem('advait_admin_user', JSON.stringify(admin));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed.' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Authentication error. Please check credentials.',
      };
    }
  };

  const logout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('advait_admin_token');
    localStorage.removeItem('advait_admin_user');
  };

  const authHeaders = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

  return (
    <AdminAuthContext.Provider
      value={{
        adminToken,
        adminUser,
        isAuthenticated: !!adminToken && !!adminUser,
        loading,
        login,
        logout,
        authHeaders,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
