import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('advait_auth_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.config?.url?.startsWith('/admin/')) {
        window.dispatchEvent(new Event('advait-admin-session-expired'));
      } else {
        localStorage.removeItem('advait_auth_token');
        localStorage.removeItem('advait_user');
        window.dispatchEvent(new Event('advait-customer-session-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
