import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Get admin token from cookies
 */
export async function getAdminToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return token || null;
}

/**
 * Verify admin authentication and get admin data
 */
export async function getAdminUser() {
  const token = await getAdminToken();
  
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.data?.admin) {
      return data.data.admin;
    }

    return null;
  } catch (error) {
    console.error('Error verifying admin:', error);
    return null;
  }
}

/**
 * Require admin authentication - redirects to login if not authenticated
 */
export async function requireAdmin() {
  const admin = await getAdminUser();
  
  if (!admin) {
    redirect('/admin/login');
  }

  return admin;
}

