'use client'
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WelcomeLayout } from "@/components/auth/onboard";
import { Select } from "@/components/shared";
import { getAllCities } from "@/lib/data/indianStatesDistricts";
import { upsertUserAddress, getUserAddress } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function StepTwoC() {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [cityOptions, setCityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);
  const router = useRouter();
  const { user, refreshUser, isLoading } = useAuth();

  const cities = useMemo(() => getAllCities(), []);

  useEffect(() => {
    queueMicrotask(() => {
      setCityOptions(cities.map((c) => ({ value: c, label: c })));
    });
  }, [cities]);

  useEffect(() => {
    const loadCity = async () => {
      try {
        const response = await getUserAddress();
        if (response.success && response.data?.city_town_village) {
          setSelectedCity(response.data.city_town_village);
        }
      } catch (err) { console.error("Error loading city:", err); }
    };
    if (!isLoading && user) loadCity();
  }, [isLoading, user]);

  useEffect(() => {
    if (!isLoading && user?.onboarding_completed && !isNavigatingToHome && !saving) {
      setIsRedirecting(true);
      router.prefetch('/');
      const timer = setTimeout(() => { router.replace('/'); }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToHome, saving]);

  if (isLoading || (isRedirecting && !saving && !isNavigatingToHome)) {
    return <OnboardingLoader message={isRedirecting ? "Taking you home..." : "Loading..."} />;
  }
  if (user?.onboarding_completed && !saving && !isNavigatingToHome) {
    return <OnboardingLoader message="Taking you home..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) { setError("Please select your city"); return; }
    if (!user)         { setError("You must be logged in to save your city"); return; }

    setSaving(true);
    setError(null);
    setIsNavigatingToHome(true);

    try {
      const response = await upsertUserAddress({ city_town_village: selectedCity, country: "India" });
      if (response.success) {
        await refreshUser();
        try { sessionStorage.setItem("cf_onboarding_referral_step", "1"); } catch { /* ignore */ }
        router.prefetch("/step-referral");
        router.replace("/step-referral");
      } else {
        setError(response.message || "Failed to save city. Please try again.");
        setSaving(false);
        setIsNavigatingToHome(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error updating city:", err);
      setSaving(false);
      setIsNavigatingToHome(false);
    }
  };

  const isBusy = saving || isNavigatingToHome;

  return (
    <WelcomeLayout
      progress={90}
      isLoading={isBusy}
      scribbleTitle="Your"
      scribbleSuffix="city"
    >
      {!isBusy && (
        <>
          <p className="mb-5 text-sm text-slate-500 -mt-1">
            We&apos;ll connect you with nearby opportunities.
          </p>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Select
              options={cityOptions}
              value={selectedCity}
              onChange={(value) => setSelectedCity(value || "")}
              placeholder="Search and select your city"
              isSearchable={true}
              isClearable={false}
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
                disabled={saving || !selectedCity}
                className="landing-cta flex-1 rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </form>
        </>
      )}
    </WelcomeLayout>
  );
}
