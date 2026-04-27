'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeLayout } from "@/components/auth/onboard";
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
    <WelcomeLayout progress={20} scribbleTitle="Welcome" scribbleSuffix="to UniTracko">
      <p className="mb-6 text-sm text-slate-500 leading-relaxed -mt-1">
        I&apos;m your personal study companion. Let&apos;s get you set up in just a few steps.
      </p>

      {/* Feature bullets */}
      <ul className="mb-7 flex flex-col gap-3">
        {[
          "Personalised exam preparation paths",
          "Reading habit tracker built in",
          "Step-by-step guidance, always",
        ].map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-700">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f0c544]/30">
              <svg className="h-2.5 w-2.5 text-slate-800" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {feat}
          </li>
        ))}
      </ul>

      {/* CTA — matches login page button style */}
      <button
        onClick={() => router.push("/step-2")}
        className="landing-cta w-full rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
      >
        Get Started
      </button>
    </WelcomeLayout>
  );
}
