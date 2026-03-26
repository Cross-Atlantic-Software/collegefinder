"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell, LoginStepOneForm } from "@/components/auth";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import { Logo } from "@/components/shared";

export default function LoginStepOnePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, always go to dashboard
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loader while checking auth or redirecting
  if (isLoading || isAuthenticated) {
    return <OnboardingLoader message="Redirecting to dashboard..." />;
  }

  return (
    <AuthShell variant="minimal" showMinimalHeader={false} contentClassName="items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center gap-6">
        <Logo mode="light" width={190} height={42} className="h-auto w-[170px] sm:w-[190px]" />
        <LoginStepOneForm />
      </div>
    </AuthShell>
  );
}
