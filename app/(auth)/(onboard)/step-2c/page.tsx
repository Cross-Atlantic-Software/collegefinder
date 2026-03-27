'use client'
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button, Select } from "@/components/shared";
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
  const [isNavigatingToDashboard, setIsNavigatingToDashboard] = useState(false);
  const router = useRouter();
  const { user, refreshUser, isLoading } = useAuth();

  const cities = useMemo(() => getAllCities(), []);

  useEffect(() => {
    queueMicrotask(() => {
        setCityOptions(
      cities.map((c) => ({
          value: c,
          label: c,
        }))
    );
    });
  }, [cities]);

  useEffect(() => {
    const loadCity = async () => {
      try {
        const response = await getUserAddress();
        if (response.success && response.data?.city_town_village) {
          setSelectedCity(response.data.city_town_village);
        }
      } catch (err) {
        console.error("Error loading city:", err);
      }
    };

    if (!isLoading && user) {
      loadCity();
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (!isLoading && user?.onboarding_completed && !isNavigatingToDashboard && !saving) {
      setIsRedirecting(true);
      router.prefetch('/dashboard');
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToDashboard, saving]);

  if (isLoading || (isRedirecting && !saving && !isNavigatingToDashboard)) {
    return <OnboardingLoader message={isRedirecting ? "Taking you to dashboard..." : "Loading..."} />;
  }

  if (user?.onboarding_completed && !saving && !isNavigatingToDashboard) {
    return <OnboardingLoader message="Taking you to dashboard..." />;
  }

  if (saving || isNavigatingToDashboard) {
    return <OnboardingLoader message="Saving your city..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCity) {
      setError("Please select your city");
      return;
    }

    if (!user) {
      setError("You must be logged in to save your city");
      return;
    }

    setSaving(true);
    setError(null);
    setIsNavigatingToDashboard(true);

    try {
      const response = await upsertUserAddress({
        city_town_village: selectedCity,
        country: "India",
      });

      if (response.success) {
        await refreshUser();
        router.prefetch("/dashboard");
        router.replace("/dashboard");
      } else {
        setError(response.message || "Failed to save city. Please try again.");
        setSaving(false);
        setIsNavigatingToDashboard(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error updating city:", err);
      setSaving(false);
      setIsNavigatingToDashboard(false);
    }
  };

  return (
    <div
      className="h-screen w-full flex flex-col"
      style={{
        background:
          "linear-gradient(90deg, #140E27 0%, #240F3C 50%, #341050 100%)",
      }}
    >
      <WelcomeLayout progress={90}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl mx-auto">
          <div className="flex-shrink-0">
            <Robot variant="five" />
          </div>

          <div className="flex flex-col gap-5 w-full max-w-xl">
            <Bubble className="w-full max-w-none">Which city are you in?</Bubble>

            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Select
                options={cityOptions}
                value={selectedCity}
                onChange={(value) => setSelectedCity(value || "")}
                placeholder="Search and select your city"
                isSearchable={true}
                isClearable={false}
              />

              <Button
                type="submit"
                variant="DarkGradient"
                size="lg"
                className="w-full rounded-full min-h-[48px]"
                disabled={saving || !selectedCity}
              >
                {saving ? "Saving..." : "Continue"}
              </Button>
            </form>
          </div>
        </div>
      </WelcomeLayout>
    </div>
  );
}
