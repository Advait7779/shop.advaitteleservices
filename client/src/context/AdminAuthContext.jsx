import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../services/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);

  useEffect(() => {
    const abort = new AbortController();
    const initial = generation.current;
    const expire = () => {
      generation.current += 1;
      setAdminUser(null);
    };
    window.addEventListener('advait-admin-session-expired', expire);
    api.get('/admin/auth/me', { signal: abort.signal, skipSessionExpiry: true }).then(({ data }) => {
      if (!abort.signal.aborted && initial === generation.current) setAdminUser(data.admin);
    }).catch(() => {}).finally(() => {
      if (!abort.signal.aborted) setLoading(false);
    });
    return () => {
      abort.abort();
      window.removeEventListener('advait-admin-session-expired', expire);
    };
  }, []);

  const login = async (identifier, password, code) => {
    try {
      const { data } = await api.post('/admin/auth/login', { identifier, password, code }, { skipSessionExpiry: true });
      generation.current += 1;
      setAdminUser(data.admin);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Could not sign in. Please try again.' };
    }
  };

  const logout = async () => {
    await api.post('/admin/auth/logout');
    generation.current += 1;
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isAuthenticated: Boolean(adminUser), loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
};
