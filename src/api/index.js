import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000, // 2 minutes default timeout
});

// Request Interceptor: Attach JWT Token from localStorage and client origin
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      config.headers['X-Client-Url'] = window.location.origin;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const message = (error.response.data?.message || '').toLowerCase();
      // If unauthorized due to token issue or session expiration, log out user
      if (
        error.response.status === 401 ||
        message.includes('expired') ||
        message.includes('token') ||
        message.includes('logged in') ||
        message.includes('session')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('session_login_time');
        sessionStorage.removeItem('session_tracked_pages');
        
        // Redirect to login if currently on a protected route
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        const isPublicPath = typeof window !== 'undefined' && publicPaths.some(p => window.location.pathname.startsWith(p));
        if (!isPublicPath && typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
