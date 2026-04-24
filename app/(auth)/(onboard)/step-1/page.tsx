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

  useEffect(() => {
    if (!isLoading && user?.onboarding_completed) {
      queueMicrotask(() => setIsRedirecting(true));
      router.prefetch('/');
      const timer = setTimeout(() => {
        router.replace('/');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  if (isLoading || isRedirecting) {
    return <OnboardingLoader message={isRedirecting ? "Taking you home..." : "Loading..."} />;
  }

  if (user?.onboarding_completed) {
    return <OnboardingLoader message="Taking you home..." />;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#F6F8FA]">
      <WelcomeLayout progress={20}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl">
          <Robot variant="three" />

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
