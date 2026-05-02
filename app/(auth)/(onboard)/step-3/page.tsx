'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Remove WelcomeLayout import
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function StepThree() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [hasLoadedUser, setHasLoadedUser] = useState(false);
  const userName = user?.name || "there";

  useEffect(() => {
    if (!isLoading && !hasLoadedUser) {
      refreshUser()
        .then(() => { queueMicrotask(() => setHasLoadedUser(true)); })
        .catch(err => {
          console.error("Error refreshing user:", err);
          queueMicrotask(() => setHasLoadedUser(true));
        });
    }
  }, [isLoading, hasLoadedUser, refreshUser]);

  useEffect(() => {
    if (!isLoading && hasLoadedUser && !user?.onboarding_completed) {
      if (!user?.name) { router.replace('/step-2'); }
      else             { router.replace('/step-2a'); }
    }
  }, [user, isLoading, router, hasLoadedUser]);

  if (isLoading || !hasLoadedUser) {
    return <OnboardingLoader message="Loading..." />;
  }
  if (!user?.onboarding_completed) {
    return <OnboardingLoader message="Redirecting to complete onboarding..." />;
  }

  return (
    <>
      {/* Animated check circle */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0c544] shadow-[0_0_0_8px_rgba(240,197,68,0.18)]">
          <svg
            className="h-8 w-8 text-slate-900 animate-tick-pop"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">
          You&apos;re all set{userName !== "there" ? `, ${userName}` : ""}!
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-[280px] leading-relaxed">
          Your profile is ready. Let&apos;s kick off your study journey.
        </p>
      </div>

      {/* Feature recap */}
      <ul className="mb-7 flex flex-col gap-3">
        {[
          "Personalised prep path activated",
          "Reading habit tracker enabled",
          "Step-by-step guidance ready",
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

      <button
        onClick={() => router.replace("/")}
        className="landing-cta w-full rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
      >
        Go to Dashboard
      </button>
    </>
  );
}
