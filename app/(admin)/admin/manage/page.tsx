'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ManagePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new admin users route
    router.replace('/admin/admin-users');
  }, [router]);

  return null;
}
