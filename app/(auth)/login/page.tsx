"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell, LoginStepOneForm } from "@/components/auth";
import { MascotBubble } from "@/components/auth";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

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
    <>
      <AuthShell>
        <div className="mx-auto flex w-full flex-col px-6 pb-10 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <LoginStepOneForm />
        </div>
      </AuthShell>
      <MascotBubble
        variant="one"
        message={
          <>
            Go no, Click on the button and start the learning progress.
          </>
        }
      />
    </>
  );
}
