'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardShimmer } from "@/components/auth/onboard/WelcomeLayout";
import { Select } from "@/components/shared";
import { upsertUserAddress, getUserAddress } from "@/api";
import { getAllStates, getDistrictsForState } from "@/lib/data/indianStatesDistricts";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function StepTwoD() {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [stateOptions, setStateOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isNavigatingToStep3, setIsNavigatingToStep3] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const states = getAllStates();
    setStateOptions(states.map(state => ({ value: state, label: state })));
  }, []);

  useEffect(() => {
    const loadAddressData = async () => {
      try {
        const response = await getUserAddress();
        if (response.success && response.data) {
          if (response.data.state) {
            setSelectedState(response.data.state);
            const districts = getDistrictsForState(response.data.state);
            setDistrictOptions(districts.map(district => ({ value: district, label: district })));
            if (response.data.district) setSelectedDistrict(response.data.district);
          }
        }
      } catch (err) { console.error("Error loading address data:", err); }
    };
    if (!isLoading && user) loadAddressData();
  }, [isLoading, user]);

  useEffect(() => {
    if (selectedState) {
      const districts = getDistrictsForState(selectedState);
      setDistrictOptions(districts.map(district => ({ value: district, label: district })));
      setSelectedDistrict("");
    } else {
      setDistrictOptions([]);
      setSelectedDistrict("");
    }
  }, [selectedState]);

  useEffect(() => {
    if (!isLoading && user?.onboarding_completed && !isNavigatingToStep3 && !saving) {
      setIsRedirecting(true);
      router.prefetch('/');
      const timer = setTimeout(() => { router.replace('/'); }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToStep3, saving]);

  if (isLoading || (isRedirecting && !saving && !isNavigatingToStep3)) {
    return <OnboardingLoader message={isRedirecting ? "Taking you home..." : "Loading..."} />;
  }
  if (user?.onboarding_completed && !saving && !isNavigatingToStep3) {
    return <OnboardingLoader message="Taking you home..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedState)    { setError("Please select your state"); return; }
    if (!selectedDistrict) { setError("Please select your district"); return; }
    if (!user)             { setError("You must be logged in to save your location"); return; }

    setSaving(true);
    setError(null);
    setIsNavigatingToStep3(true);

    try {
      const response = await upsertUserAddress({
        state: selectedState,
        district: selectedDistrict,
        country: "India",
      });
      if (response.success) {
        router.prefetch("/step-3");
        router.replace("/step-3");
      } else {
        setError(response.message || "Failed to save location. Please try again.");
        setSaving(false);
        setIsNavigatingToStep3(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error updating address:", err);
      setSaving(false);
      setIsNavigatingToStep3(false);
    }
  };

  const isBusy = saving || isNavigatingToStep3;

  if (isBusy) return <CardShimmer />;

  return (
    <>
      {!isBusy && (
        <>
          <p className="mb-5 text-sm text-slate-500 -mt-1">
            Select your state and district.
          </p>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Select
              options={stateOptions}
              value={selectedState}
              onChange={(value) => setSelectedState(value || "")}
              placeholder="Select your state"
              isSearchable={true}
              isClearable={false}
            />
            <Select
              options={districtOptions}
              value={selectedDistrict}
              onChange={(value) => setSelectedDistrict(value || "")}
              placeholder={selectedState ? "Select your district" : "Select state first"}
              isSearchable={true}
              isClearable={false}
              disabled={!selectedState}
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
                disabled={saving || !selectedState || !selectedDistrict}
                className="landing-cta flex-1 rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </form>
        </>
      )}
    </>
  );
}
