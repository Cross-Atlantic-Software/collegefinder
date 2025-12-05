// Server-only module - do not import in client components

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Get admin token from cookies
 */
export async function getAdminToken(): Promise<string | null> {
  // Runtime check to ensure this is only used on the server
  if (typeof window !== 'undefined') {
    throw new Error('getAdminToken can only be used in Server Components');
  }

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    return token || null;
  } catch (error) {
    console.error('Error getting admin token from cookies:', error);
    return null;
  }
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
  // Runtime check to ensure this is only used on the server
  if (typeof window !== 'undefined') {
    throw new Error('requireAdmin can only be used in Server Components');
  }

  const admin = await getAdminUser();
  
  if (!admin) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/login');
  }

  return admin;
}

