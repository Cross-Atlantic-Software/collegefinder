'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardShimmer } from "@/components/auth/onboard/WelcomeLayout";
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
  if (!user) return <OnboardingLoader message="Loading..." />;

  if (continueLoading) return <CardShimmer />;
  
  return (
    <>
      {!continueLoading && (
        <>
          <p className="mb-5 text-sm text-slate-500 -mt-1">
            Enter it below — or skip and go straight to your dashboard.
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

          <div className="flex items-center gap-3 mb-2.5">
            <button
              onClick={() => router.back()}
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
              {referralInput.trim() ? "Apply & Continue" : "Continue"}
            </button>
          </div>
          <button
            onClick={goHome}
            disabled={continueLoading}
            className="w-full rounded-full border border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
        </>
      )}
    </>
  );
}
