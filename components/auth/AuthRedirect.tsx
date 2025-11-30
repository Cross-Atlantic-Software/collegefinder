'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Redirects authenticated users away from auth pages (login, OTP, etc.)
 * But allows access to onboarding pages (/step-1, /step-2, /step-3)
 */
export function AuthRedirect({ 
  children, 
  redirectTo = '/dashboard' 
}: AuthRedirectProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is an onboarding step
  const isOnboardingRoute = /\/(step-[1-3]|step-1|step-2|step-3)/.test(pathname || '');

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isOnboardingRoute) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, isOnboardingRoute]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && !isOnboardingRoute) {
    return null;
  }

  return <>{children}</>;
}

