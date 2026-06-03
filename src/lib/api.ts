// API base URL - you can change this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Token handling functions using cookies
export const tokenUtils = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('token=')
      );
      return tokenCookie ? tokenCookie.split('=')[1] : null;
    }
    return null;
  },
  
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      // Set cookie with Safari-compatible settings
      const isProduction = process.env.NODE_ENV === 'production';
      const sameSite = isProduction ? 'None' : 'Lax';
      const secure = isProduction ? '; Secure' : '';
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=${sameSite}${secure}`;
    }
  },
  
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      // Remove cookie by setting it to expire in the past with Safari-compatible settings
      const isProduction = process.env.NODE_ENV === 'production';
      const sameSite = isProduction ? 'None' : 'Lax';
      const secure = isProduction ? '; Secure' : '';
      document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=${sameSite}${secure}`;
    }
  }
};

// Helper to handle API response and intercept unauthorized states
const handleResponse = async (response: Response): Promise<Response> => {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      console.warn('⚠️ API returned 401 Unauthorized. Clearing session...');
      tokenUtils.removeToken();
      
      const isProduction = process.env.NODE_ENV === 'production';
      const sameSite = isProduction ? 'None' : 'Lax';
      const secure = isProduction ? '; Secure' : '';
      document.cookie = `role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=${sameSite}${secure}`;
      
      const pathname = window.location.pathname;
      const isProtectedRoute = 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/dashboard') || 
        pathname.startsWith('/profile') || 
        pathname.startsWith('/orders') || 
        pathname.startsWith('/checkout');
        
      if (isProtectedRoute && !pathname.startsWith('/auth/')) {
        window.location.href = `/auth/login?sessionExpired=true&redirect=${encodeURIComponent(pathname)}`;
      }
    }
  }
  return response;
};

// Generic CRUD operations
export const api = {
  // GET request
  get: async <T>(url: string, params?: any): Promise<Response> => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const token = tokenUtils.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}${queryString}`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies in requests
    });
    return handleResponse(response);
  },

  // POST request
  post: async <T>(url: string, data?: any): Promise<Response> => {
    const token = tokenUtils.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include', // Include cookies in requests
    });
    return handleResponse(response);
  },

  // POST form data (for file uploads)
  postForm: async <T>(url: string, formData: FormData): Promise<Response> => {
    const token = tokenUtils.getToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include', // Include cookies in requests
    });
    return handleResponse(response);
  },

  // PUT request
  put: async <T>(url: string, data?: any): Promise<Response> => {
    const token = tokenUtils.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include', // Include cookies in requests
    });
    return handleResponse(response);
  },

  // PATCH request
  patch: async <T>(url: string, data?: any): Promise<Response> => {
    const token = tokenUtils.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include', // Include cookies in requests
    });
    return handleResponse(response);
  },

  // DELETE request
  delete: async <T>(url: string): Promise<Response> => {
    const token = tokenUtils.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers,
      credentials: 'include', // Include cookies in requests
    });
    return handleResponse(response);
  },
};

export default api;
