'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, isLoading } = useAuth();
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

  // Show loader while checking authentication
  if (isLoading) {
    return <OnboardingLoader message="Loading dashboard..." />;
  }

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
