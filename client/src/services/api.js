import axios from 'axios';

try {
  for (const key of ['advait_auth_token', 'advait_user', 'advait_admin_token', 'advait_admin_user']) {
    localStorage.removeItem(key);
  }
} catch {
  // Session cookies can still work when browser storage is unavailable.
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'X-Advait-Request': '1',
  },
});

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipSessionExpiry) {
      if (error.config?.url?.startsWith('/admin/')) {
        window.dispatchEvent(new Event('advait-admin-session-expired'));
      } else {
        window.dispatchEvent(new Event('advait-customer-session-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
