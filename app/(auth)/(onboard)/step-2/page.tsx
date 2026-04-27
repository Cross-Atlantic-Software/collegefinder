'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WelcomeLayout } from "@/components/auth/onboard";
import { updateProfile } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function StepTwo() {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isNavigatingToStep2A, setIsNavigatingToStep2A] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user?.onboarding_completed && !isNavigatingToStep2A && !saving) {
      queueMicrotask(() => setIsRedirecting(true));
      router.prefetch('/');
      const timer = setTimeout(() => { router.replace('/'); }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToStep2A, saving]);

  if (isLoading || (isRedirecting && !saving && !isNavigatingToStep2A)) {
    return <OnboardingLoader message={isRedirecting ? "Taking you home..." : "Loading..."} />;
  }
  if (user?.onboarding_completed && !saving && !isNavigatingToStep2A) {
    return <OnboardingLoader message="Taking you home..." />;
  }

  const isBusy = saving || isNavigatingToStep2A;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!user)        { setError("You must be logged in to save your name"); return; }

    setSaving(true);
    setError(null);
    setIsNavigatingToStep2A(true);

    try {
      const response = await updateProfile(name.trim());
      if (response.success) {
        router.prefetch("/step-2a");
        router.replace("/step-2a");
      } else {
        setError(response.message || "Failed to save name. Please try again.");
        setSaving(false);
        setIsNavigatingToStep2A(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error updating profile:", err);
      setSaving(false);
      setIsNavigatingToStep2A(false);
    }
  };

  return (
    <WelcomeLayout
      progress={40}
      isLoading={isBusy}
      scribbleTitle="What's"
      scribbleSuffix="your name?"
    >
      {!isBusy && (
        <>
          <p className="mb-5 text-sm text-slate-500 -mt-1">
            We&apos;ll personalise your experience with it.
          </p>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:border-slate-900"
              required
              minLength={1}
              maxLength={255}
              autoFocus
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex shrink-0 h-[46px] w-[46px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="landing-cta flex-1 rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sounds Good
              </button>
            </div>
          </form>
        </>
      )}
    </WelcomeLayout>
  );
}
