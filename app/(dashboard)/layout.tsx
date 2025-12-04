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
  const { user, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect to onboarding if user doesn't have a name (hasn't completed onboarding)
  useEffect(() => {
    if (!isLoading && user && !user.name) {
      setIsRedirecting(true);
      // Prefetch step-1 for faster loading
      router.prefetch("/step-1");
      // Use replace for smoother redirect (no back button history)
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        router.replace("/step-1");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  // Show smooth loader while checking auth and onboarding status
  if (isLoading || (user && !user.name) || isRedirecting) {
    return <OnboardingLoader message="Redirecting to onboarding..." />;
  }

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
