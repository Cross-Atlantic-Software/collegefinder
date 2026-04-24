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
 * Redirects to home if user has completed onboarding (has name)
 */
export function AuthRedirect({ 
  children, 
  redirectTo = '/' 
}: AuthRedirectProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is an onboarding step
  const isOnboardingRoute = /\/(step-[1-3]|step-1|step-2|step-2a|step-2b|step-2c|step-3|step-referral)/.test(pathname || '');
  
  // Check if user has completed onboarding
  const hasCompletedOnboarding = user?.onboarding_completed;

  useEffect(() => {
    if (!isLoading) {
      // Allow certain steps even if onboarding is already marked complete (multi-step flow)
      const isStep3 = pathname?.includes('/step-3');
      const isStep2A = pathname?.includes('/step-2a');
      const isStep2B = pathname?.includes('/step-2b');
      const isStep2C = pathname?.includes('/step-2c');
      const isStepReferral = pathname?.includes('/step-referral');
      const isAllowedStep = isStep3 || isStep2A || isStep2B || isStep2C || isStepReferral;
      
      // If authenticated and on onboarding route (but not allowed steps) and has completed onboarding, redirect to home
      if (isAuthenticated && isOnboardingRoute && hasCompletedOnboarding && !isAllowedStep) {
        router.prefetch(redirectTo);
        router.replace(redirectTo);
        return;
      }
      
      // If authenticated and NOT on onboarding route, redirect to home
      if (isAuthenticated && !isOnboardingRoute) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, isOnboardingRoute, hasCompletedOnboarding, router, redirectTo, pathname]);

  if (isLoading) {
    return <OnboardingLoader message="Loading..." />;
  }

  // If authenticated user with completed onboarding tries to access onboarding (but not allowed steps), show loader while redirecting
  const isStep3 = pathname?.includes('/step-3');
  const isStep2A = pathname?.includes('/step-2a');
  const isStep2B = pathname?.includes('/step-2b');
  const isStep2C = pathname?.includes('/step-2c');
  const isStepReferral = pathname?.includes('/step-referral');
  const isAllowedStep = isStep3 || isStep2A || isStep2B || isStep2C || isStepReferral;
  if (isAuthenticated && isOnboardingRoute && hasCompletedOnboarding && !isAllowedStep) {
    return <OnboardingLoader message="Taking you home..." />;
  }

  // If authenticated and NOT on onboarding route, don't render (will redirect)
  if (isAuthenticated && !isOnboardingRoute) {
    return null;
  }

  return <>{children}</>;
}

