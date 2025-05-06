import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ap-backend-taupe.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to handle CORS preflight
api.interceptors.request.use((config) => {
  // Add timestamp to prevent caching
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;