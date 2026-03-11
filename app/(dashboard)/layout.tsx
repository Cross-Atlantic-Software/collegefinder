'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { user, isLoading, userVerifiedFromServer } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Track initial load completion
  useEffect(() => {
    if (!isLoading && user) {
      // Small delay to show loader during navigation
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user]);

  // Redirect to step-1 ONLY when server confirmed they haven't completed. If stored user has onboarding_completed === true, we never redirect.
  useEffect(() => {
    if (!isLoading && userVerifiedFromServer && user && user.onboarding_completed === false) {
      setIsRedirecting(true);
      router.prefetch("/step-1");
      const timer = setTimeout(() => {
        router.replace("/step-1");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, userVerifiedFromServer, router]);

  // Show loader only when loading or when redirecting to step-1. If user has onboarding_completed === true (from storage), show dashboard immediately.
  const mustRedirectToOnboarding = userVerifiedFromServer && user && user.onboarding_completed === false;
  if (isLoading || mustRedirectToOnboarding || isRedirecting) {
    return <OnboardingLoader message={isRedirecting ? "Redirecting to onboarding..." : "Loading dashboard..."} />;
  }

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
