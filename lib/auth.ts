import { User } from '@/api';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h, aligned with the JWT lifetime

/**
 * Mirror the auth token into a readable (non-httpOnly) cookie.
 * - Lets the ExamFill browser extension detect an existing session via
 *   chrome.cookies — no open tab / page refresh required.
 * - Also enables server-side rendering auth (lib/server/* reads this cookie).
 */
function writeAuthCookie(token: string): void {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Ensure the auth cookie matches the stored token. Call on app startup so
 * sessions created before this change (token only in localStorage) also get
 * the cookie.
 */
export function syncAuthCookie(): void {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) writeAuthCookie(token);
}

/**
 * Store authentication token
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    writeAuthCookie(token);
  }
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove authentication token
 */
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearAuthCookie();
  }
}

/**
 * Store user data
 */
export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Get user data
 */
export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
  }
  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Clear all auth data
 */
export function clearAuth(): void {
  removeAuthToken();
}

