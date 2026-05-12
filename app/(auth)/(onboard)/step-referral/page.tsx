'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardShimmer } from "@/components/auth/onboard/WelcomeLayout";
import { getBasicInfo, updateBasicInfo } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import { SIGNUP_WELCOME_SESSION_KEY } from "@/lib/signupWelcomeFlag";

const STORAGE_KEY = "cf_onboarding_referral_step";
const BACK_FROM_REFERRAL_KEY = "cf_onboarding_back_from_referral";

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
    try { fromCityStep = sessionStorage.getItem(STORAGE_KEY) === "1"; } catch { /* ignore */ }
    if (!fromCityStep) {
      queueMicrotask(() => setIsRedirecting(true));
      if (user.onboarding_completed) { router.replace("/"); } else { router.replace("/step-1"); }
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
      } catch { /* non-blocking */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const goHome = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    try { sessionStorage.setItem(SIGNUP_WELCOME_SESSION_KEY, "1"); } catch { /* ignore */ }
    window.location.href = "/";
  };

  const handleBackToPreviousStep = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
      sessionStorage.setItem(BACK_FROM_REFERRAL_KEY, "1");
    } catch {
      /* ignore */
    }
    router.replace("/step-2c?from=referral");
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
  if (!user) return <OnboardingLoader message="Loading..." />;

  if (continueLoading) return <CardShimmer />;
  
  return (
    <>
      {!continueLoading && (
        <>
          <p className="mb-5 text-sm text-slate-500 -mt-1">
            Drop it here if you have one — you can skip this
          </p>

          {referralError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {referralError}
            </div>
          )}

          <div className="mb-5">
            <input
              type="text"
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              placeholder="e.g. FRIEND2025"
              maxLength={32}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 font-mono text-sm tracking-widest text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 placeholder:tracking-normal focus:border-slate-900"
              spellCheck={false}
              autoCapitalize="characters"
            />
          </div>

          <div className="flex items-center gap-3 mb-2.5 mt-auto pt-4">
            <button
              type="button"
              onClick={handleBackToPreviousStep}
              disabled={continueLoading}
              className="flex shrink-0 h-[46px] w-[46px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleContinue}
              disabled={continueLoading}
              className="landing-cta flex-1 rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </>
      )}
    </>
  );
}
