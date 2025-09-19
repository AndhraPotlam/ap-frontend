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

// Generic CRUD operations
export const api = {
  // GET request
  get: async <T>(url: string, params?: any): Promise<Response> => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return await fetch(`${API_BASE_URL}${url}${queryString}`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies in requests
    });
  },

  // POST request
  post: async <T>(url: string, data?: any): Promise<Response> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include', // Include cookies in requests
    });
  },

  // POST form data (for file uploads)
  postForm: async <T>(url: string, formData: FormData): Promise<Response> => {
    const token = tokenUtils.getToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include', // Include cookies in requests
    });
  },

  // PUT request
  put: async <T>(url: string, data?: any): Promise<Response> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include', // Include cookies in requests
    });
  },

  // PATCH request
  patch: async <T>(url: string, data?: any): Promise<Response> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return await fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include', // Include cookies in requests
    });
  },

  // DELETE request
  delete: async <T>(url: string): Promise<Response> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers,
      credentials: 'include', // Include cookies in requests
    });
  },
};

export default api;
