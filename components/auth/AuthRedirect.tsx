'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingLoader from '@/components/shared/OnboardingLoader';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Redirects authenticated users away from auth pages (login, OTP, etc.)
 * Allows access to onboarding pages only if user hasn't completed onboarding (no name)
 * Redirects to dashboard if user has completed onboarding (has name)
 */
export function AuthRedirect({ 
  children, 
  redirectTo = '/dashboard' 
}: AuthRedirectProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is an onboarding step
  const isOnboardingRoute = /\/(step-[1-3]|step-1|step-2|step-3)/.test(pathname || '');
  
  // Check if user has completed onboarding (has a name)
  const hasCompletedOnboarding = user?.name;

  useEffect(() => {
    if (!isLoading) {
      // Allow step-3 to show even if user has completed onboarding (they just finished)
      const isStep3 = pathname?.includes('/step-3');
      
      // If authenticated and on onboarding route (but not step-3) and has completed onboarding, redirect to dashboard
      if (isAuthenticated && isOnboardingRoute && hasCompletedOnboarding && !isStep3) {
        router.prefetch(redirectTo);
        router.replace(redirectTo);
        return;
      }
      
      // If authenticated and NOT on onboarding route, redirect to dashboard
      if (isAuthenticated && !isOnboardingRoute) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, isOnboardingRoute, hasCompletedOnboarding, router, redirectTo, pathname]);

  if (isLoading) {
    return <OnboardingLoader message="Loading..." />;
  }

  // If authenticated user with completed onboarding tries to access onboarding (but not step-3), show loader while redirecting
  const isStep3 = pathname?.includes('/step-3');
  if (isAuthenticated && isOnboardingRoute && hasCompletedOnboarding && !isStep3) {
    return <OnboardingLoader message="Taking you to dashboard..." />;
  }

  // If authenticated and NOT on onboarding route, don't render (will redirect)
  if (isAuthenticated && !isOnboardingRoute) {
    return null;
  }

  return <>{children}</>;
}

