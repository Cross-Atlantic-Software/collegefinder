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
        setHasLoadedUser(true);
      }).catch(err => {
        console.error("Error refreshing user:", err);
        setHasLoadedUser(true); // Continue even if refresh fails
      });
    }
  }, [isLoading, hasLoadedUser, refreshUser]);

  // Only redirect if user hasn't completed onboarding (shouldn't be here - they need to complete previous steps first)
  useEffect(() => {
    if (!isLoading && hasLoadedUser && !user?.onboarding_completed) {
      // Check which step they need to complete
      if (!user?.name) {
        // No name, go to step-2
        setIsRedirecting(true);
        router.replace('/step-2');
      } else {
        // Has name, check if they have stream and interests
        // For now, just redirect to step-2a if onboarding not completed
        // The backend should track completion status
        setIsRedirecting(true);
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
    <div
      className="h-screen w-full flex flex-col"
      style={{
        background:
          "linear-gradient(90deg, #140E27 0%, #240F3C 50%, #341050 100%)",
      }}
    >
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
                href="/dashboard"
                className="px-10 rounded-full"
              >
                Lets go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </WelcomeLayout>
    </div>
  );
}
