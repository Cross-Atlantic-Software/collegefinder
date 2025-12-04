/**
 * Server-side data fetching for user pages
 */

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Get user token from cookies
 */
export async function getUserToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  return token || null;
}

/**
 * Fetch profile completion percentage
 */
export async function getProfileCompletion(): Promise<number> {
  const token = await getUserToken();
  
  if (!token) {
    return 0;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile/completion`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    if (data.success && data.data?.percentage !== undefined) {
      return data.data.percentage;
    }

    return 0;
  } catch (error) {
    console.error('Error fetching profile completion:', error);
    return 0;
  }
}

