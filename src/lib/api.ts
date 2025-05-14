import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add specific config for Vercel deployment
  ...(process.env.VERCEL && {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    }
  })
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching in Vercel
    if (process.env.VERCEL) {
      config.params = { 
        ...config.params,
        _t: Date.now() 
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Use window.location for hard redirect to prevent caching
      if (process.env.VERCEL) {
        window.location.href = '/auth/login';
        return;
      }
      // For local development, use router
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;