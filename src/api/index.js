import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token from localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      const message = error.response.data?.message || '';
      // If unauthorized due to token issue, log out user
      if (message.includes('expired') || message.includes('token') || message.includes('logged in')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Force reload page to redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
