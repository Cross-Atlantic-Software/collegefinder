'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function StepThree() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasLoadedUser, setHasLoadedUser] = useState(false);
  const userName = user?.name || "there";

  // Refresh user data when component mounts to get the updated name
  useEffect(() => {
    if (!isLoading && !hasLoadedUser) {
      refreshUser().then(() => {
        queueMicrotask(() => setHasLoadedUser(true));
      }).catch(err => {
        console.error("Error refreshing user:", err);
        queueMicrotask(() => setHasLoadedUser(true));
      });
    }
  }, [isLoading, hasLoadedUser, refreshUser]);

  // Only redirect if user hasn't completed onboarding (shouldn't be here - they need to complete previous steps first)
  useEffect(() => {
    if (!isLoading && hasLoadedUser && !user?.onboarding_completed) {
      queueMicrotask(() => setIsRedirecting(true));
      if (!user?.name) {
        router.replace('/step-2');
      } else {
        router.replace('/step-2a');
      }
    }
  }, [user, isLoading, router, hasLoadedUser]);

  // Show smooth loader while checking auth or loading user data
  if (isLoading || !hasLoadedUser) {
    return <OnboardingLoader message="Loading..." />;
  }

  // If user hasn't completed onboarding after loading, show loader while redirecting
  if (!user?.onboarding_completed) {
    return <OnboardingLoader message="Redirecting to complete onboarding..." />;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#F6F8FA]">
      <WelcomeLayout progress={100}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl mx-auto">
          {/* Robot */}
          <div className="flex-shrink-0">
            <Robot variant="four" />
          </div>

          {/* Bubbles + Button */}
          <div className="flex flex-col gap-4 w-[500px]">
            <Bubble>
              Hey, {userName}!<br />
              I'll guide you step by step through theory and practice.
            </Bubble>

            <Bubble>I’ll also help you build a reading habit.</Bubble>

            <div className="flex justify-end mt-2">
              <Button
                variant="DarkGradient"
                size="lg"
                href="/"
                className="px-10 rounded-full"
              >
                Lets go to Home
              </Button>
            </div>
          </div>
        </div>
      </WelcomeLayout>
    </div>
  );
}
