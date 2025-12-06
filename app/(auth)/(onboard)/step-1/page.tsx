'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function StepOne() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect to dashboard if user has completed onboarding
  useEffect(() => {
    if (!isLoading && user?.onboarding_completed) {
      setIsRedirecting(true);
      // Prefetch dashboard for faster loading
      router.prefetch('/dashboard');
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  // Show smooth loader while checking auth or redirecting
  if (isLoading || isRedirecting) {
    return <OnboardingLoader message={isRedirecting ? "Taking you to dashboard..." : "Loading..."} />;
  }

  // Don't render if user has completed onboarding (will redirect)
  if (user?.onboarding_completed) {
    return <OnboardingLoader message="Taking you to dashboard..." />;
  }

  return (
    <div
      className="h-screen w-full flex flex-col"
      style={{
        background:
          "linear-gradient(90deg, #140E27 0%, #240F3C 50%, #341050 100%)",
      }}
    >
      <WelcomeLayout progress={33}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl">
          {/* Robot */}
          <Robot variant="three" />

          {/* Bubbles + Button */}
          <div className="flex flex-col gap-6 w-[500px]">
            <Bubble>
              Welcome!, I’m Support Agent
              <br />
              I’ll be your companion throughout your Learning journey.
            </Bubble>

            <Bubble>
              Exam Preparation is one of the best expertise that we have.
            </Bubble>

            <div className="flex justify-end mt-2">
              <Button
                type="submit"
                variant="DarkGradient"
                size="lg"
                href="/step-2"
                className="px-10 rounded-full"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </WelcomeLayout>
    </div>
  );
}
