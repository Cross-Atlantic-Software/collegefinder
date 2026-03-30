/**
 * Shared API client - handles all HTTP requests
 * In browser: always use relative /api so requests go to same origin (nginx proxies to backend)
 * On server: use env or localhost for SSR
 */
const API_BASE_URL =
  typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api');

/** Config for apiRequest - timeout in ms (default 10s, use 60s for question generation) */
export interface ApiRequestConfig {
  timeout?: number;
}

/**
 * Generic API fetch function with error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  config?: ApiRequestConfig
): Promise<import('./types').ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const timeoutMs = config?.timeout ?? 10000;

  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const defaultHeaders: Record<string, string> = {};
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (typeof window !== 'undefined') {
    const userToken = localStorage.getItem('auth_token');
    const adminToken = localStorage.getItem('admin_token');
    
    // Determine which token to use based on endpoint
    let token = null;
    if (endpoint.startsWith('/admin') || endpoint.startsWith('/social')) {
      // Admin routes & social tools: prefer admin token, fallback to user token
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
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
     // Convert options.headers to plain object if it's a Headers object
     const headersObj: HeadersInit = { ...defaultHeaders };
    
     if (options.headers) {
       if (options.headers instanceof Headers) {
         // Convert Headers object to plain object
         const plainHeaders: Record<string, string> = {};
         options.headers.forEach((value, key) => {
           plainHeaders[key] = value;
         });
         Object.assign(headersObj, plainHeaders);
       } else if (Array.isArray(options.headers)) {
         // Convert array of [key, value] tuples to object
         const plainHeaders: Record<string, string> = {};
         options.headers.forEach(([key, value]) => {
           plainHeaders[key] = value;
         });
       } else {
         // It's already a plain object
         Object.assign(headersObj, options.headers);
       }
     }
     const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: headersObj,
      credentials: 'include', // Send cookies for auth
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data: { message?: string; errors?: Array<{ msg: string; param: string }>; [key: string]: unknown } = {};
    
    // Clone response before reading (in case we need to read it again for error handling)
    const responseClone = response.clone();
    
    // Try to parse as JSON first (most common case)
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json() as typeof data;
      } catch {
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
      // Non-JSON response (e.g. proxy 502, Express default body, HTML error page)
      let plain = '';
      try {
        plain = await response.text();
        console.error('Non-JSON response received:', plain.substring(0, 200));
        if (plain.includes('------WebKit') || plain.includes('multipart') || plain.startsWith('------')) {
          return {
            success: false,
            message: 'Server received multipart data but expected JSON. Please check your request format.',
            errors: undefined,
          };
        }
      } catch (textError) {
        console.error('Failed to read response as text:', textError);
      }
      const trimmed = plain.trim();
      const hint =
        /internal server error/i.test(trimmed) || response.status >= 500
          ? ' Is the Node backend running on the API URL, and is GOOGLE_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY set in backend/.env? (Python Gemini keys do not apply to this route.)'
          : '';
      return {
        success: false,
        message:
          trimmed.length > 0 && trimmed.length < 400
            ? `${trimmed}${hint}`
            : `Server returned a non-JSON response (${response.status}).${hint}`,
        errors: undefined,
      };
    }

    if (!response.ok) {
      // Only 401 (Unauthorized) means session is invalid — clear and redirect to login.
      // 403 (Forbidden) means user is authenticated but not allowed for this action (e.g. module access);
      // do not clear session so Admin/Data Entry users stay logged in.
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_authenticated');
        window.location.href = '/admin/login';
      }

      return {
        success: false,
        message: data.message || 'An error occurred',
        errors: data.errors,
      };
    }

    return {
      success: true,
      ...(data as Record<string, unknown>),
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

