'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button } from "@/components/shared";
import { getBasicInfo, updateBasicInfo } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

const STORAGE_KEY = "cf_onboarding_referral_step";

export default function StepReferral() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [referralInput, setReferralInput] = useState("");
  const [continueLoading, setContinueLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;
    let fromCityStep = false;
    try {
      fromCityStep = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* sessionStorage unavailable */
    }
    if (!fromCityStep) {
      queueMicrotask(() => setIsRedirecting(true));
      if (user.onboarding_completed) {
        router.replace("/");
      } else {
        router.replace("/step-1");
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getBasicInfo();
        if (!cancelled && res.success && res.data?.referred_by_code) {
          setReferralInput(res.data.referred_by_code);
        }
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goHome = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    router.prefetch("/");
    router.replace("/");
  };

  const handleContinue = async () => {
    setReferralError(null);
    const trimmed = referralInput.trim().toUpperCase();
    if (trimmed) {
      setContinueLoading(true);
      try {
        const res = await updateBasicInfo({ referred_by_code: trimmed });
        if (!res.success) {
          setReferralError(res.message || "Could not save referral code.");
          setContinueLoading(false);
          return;
        }
        await refreshUser();
      } catch {
        setReferralError("Something went wrong. Please try again.");
        setContinueLoading(false);
        return;
      }
      setContinueLoading(false);
    }
    goHome();
  };

  if (isLoading || (isRedirecting && !continueLoading)) {
    return <OnboardingLoader message={isRedirecting ? "Taking you home..." : "Loading..."} />;
  }

  if (!user) {
    return <OnboardingLoader message="Loading..." />;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#F6F8FA]">
      <WelcomeLayout progress={95}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl mx-auto">
          <div className="flex-shrink-0">
            <Robot variant="five" />
          </div>

          <div className="flex flex-col gap-5 w-full max-w-xl">
            <Bubble>Do you have a referral code?</Bubble>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="Enter code (optional)"
                maxLength={32}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm tracking-wide text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                spellCheck={false}
                autoCapitalize="characters"
              />
              {referralError && (
                <p className="text-xs font-medium text-red-600">{referralError}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full rounded-full sm:w-auto"
                onClick={goHome}
                disabled={continueLoading}
              >
                Skip
              </Button>
              <Button
                type="button"
                variant="DarkGradient"
                size="lg"
                className="w-full rounded-full px-10 sm:w-auto"
                onClick={handleContinue}
                disabled={continueLoading}
              >
                {continueLoading ? "Saving…" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      </WelcomeLayout>
    </div>
  );
}
