'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardShimmer } from "@/components/auth/onboard/WelcomeLayout";
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
      const timer = setTimeout(() => { router.replace('/'); }, 100);
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
    <>
      <p className="mb-6 text-sm text-slate-500 leading-relaxed -mt-1">
        Your shortcut to clarity - no more endless research
      </p>

      <button
        onClick={() => router.push("/step-2")}
        className="landing-cta mt-auto w-full rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
      >
        Start Now
      </button>
    </>
  );
}
