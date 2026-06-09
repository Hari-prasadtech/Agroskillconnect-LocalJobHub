import axios from 'axios';

// In development, Vite proxy handles /api requests
// In production, use environment variable or default to same origin
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '')
  : ''; // Empty in dev mode to use Vite proxy

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout — prevents infinite loading if backend is down
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
instance.interceptors.request.use(
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

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Request timed out — backend likely not running
      console.error('Request timed out. Is the backend server running on port 5000?');
      return Promise.reject(new Error('Server is not responding. Please ensure the backend is running.'));
    }
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use React Router-compatible navigation (avoid full page reload)
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    if (error.response?.status === 403 && error.response?.data?.deactivated) {
      // Account was deactivated by admin — clear session and redirect with message
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('auth:deactivated', {
          detail: { message: error.response.data.error }
        }));
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
