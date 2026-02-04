/**
 * Shared API client - handles all HTTP requests
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Generic API fetch function with error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<import('./types').ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const defaultHeaders: HeadersInit = {};
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (typeof window !== 'undefined') {
    const userToken = localStorage.getItem('auth_token');
    const adminToken = localStorage.getItem('admin_token');
    
    // Determine which token to use based on endpoint
    let token = null;
    if (endpoint.startsWith('/admin')) {
      // Admin routes: prefer admin token, fallback to user token
      token = adminToken || userToken;
    } else {
      // Auth routes: use user token only
      token = userToken;
    }
    
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout so app doesn't hang if backend is down
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data: any = {};
    
    // Clone response before reading (in case we need to read it again for error handling)
    const responseClone = response.clone();
    
    // Try to parse as JSON first (most common case)
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, get text from clone for debugging
        try {
          const text = await responseClone.text();
          console.error('Failed to parse JSON response:', text.substring(0, 200));
          
          // Check if it looks like multipart/form-data boundary
          if (text.includes('------WebKit') || text.includes('multipart') || text.startsWith('------')) {
            return {
              success: false,
              message: 'Server received multipart data but expected JSON. This usually means a FormData request was sent incorrectly.',
              errors: undefined,
            };
          }
        } catch (textError) {
          console.error('Failed to read response as text:', textError);
        }
        return {
          success: false,
          message: 'Invalid JSON response from server',
          errors: undefined,
        };
      }
    } else {
      // Non-JSON response - get text
      try {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        
        // If it looks like multipart/form-data, it might be a misconfigured request
        if (text.includes('------WebKit') || text.includes('multipart') || text.startsWith('------')) {
          return {
            success: false,
            message: 'Server received multipart data but expected JSON. Please check your request format.',
            errors: undefined,
          };
        }
      } catch (textError) {
        console.error('Failed to read response as text:', textError);
      }
      return {
        success: false,
        message: 'Server returned an invalid response format',
        errors: undefined,
      };
    }

    if (!response.ok) {
      // Check if this is an authentication error
      if (response.status === 401 || response.status === 403) {
        // Clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_authenticated');
          window.location.href = '/admin/login';
        }
      }
      
      return {
        success: false,
        message: data.message || 'An error occurred',
        errors: data.errors,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    console.error('API request error:', error);
    return {
      success: false,
      message: isAbort ? 'Request timed out' : (error instanceof Error ? error.message : 'Network error occurred'),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

