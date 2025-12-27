'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button, Select } from "@/components/shared";
import { upsertUserAddress, getUserAddress } from "@/api";
import { getAllStates, getDistrictsForState } from "@/lib/data/indianStatesDistricts";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function StepTwoC() {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [stateOptions, setStateOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isNavigatingToStep3, setIsNavigatingToStep3] = useState(false);
  const router = useRouter();
  const { user, refreshUser, isLoading } = useAuth();

  // Initialize state options on mount
  useEffect(() => {
    const states = getAllStates();
    setStateOptions(states.map(state => ({
      value: state,
      label: state
    })));
  }, []);

  // Load existing address data if available
  useEffect(() => {
    const loadAddressData = async () => {
      try {
        const response = await getUserAddress();
        if (response.success && response.data) {
          if (response.data.state) {
            setSelectedState(response.data.state);
            // Load districts for the state
            const districts = getDistrictsForState(response.data.state);
            setDistrictOptions(districts.map(district => ({
              value: district,
              label: district
            })));
            if (response.data.district) {
              setSelectedDistrict(response.data.district);
            }
          }
        }
      } catch (err) {
        console.error("Error loading address data:", err);
      }
    };

    if (!isLoading && user) {
      loadAddressData();
    }
  }, [isLoading, user]);

  // Update district options when state changes
  useEffect(() => {
    if (selectedState) {
      const districts = getDistrictsForState(selectedState);
      setDistrictOptions(districts.map(district => ({
        value: district,
        label: district
      })));
      // Reset district when state changes
      setSelectedDistrict("");
    } else {
      setDistrictOptions([]);
      setSelectedDistrict("");
    }
  }, [selectedState]);

  // Redirect to dashboard if user has completed onboarding
  useEffect(() => {
    if (!isLoading && user?.onboarding_completed && !isNavigatingToStep3 && !saving) {
      setIsRedirecting(true);
      router.prefetch('/dashboard');
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToStep3, saving]);

  // Show smooth loader while checking auth or redirecting
  if (isLoading || (isRedirecting && !saving && !isNavigatingToStep3)) {
    return <OnboardingLoader message={isRedirecting ? "Taking you to dashboard..." : "Loading..."} />;
  }

  // Don't render if user has completed onboarding and we're not saving/navigating
  if (user?.onboarding_completed && !saving && !isNavigatingToStep3) {
    return <OnboardingLoader message="Taking you to dashboard..." />;
  }

  // Show saving state if we're navigating to step-3
  if (saving || isNavigatingToStep3) {
    return <OnboardingLoader message="Saving your location..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedState) {
      setError("Please select your state");
      return;
    }

    if (!selectedDistrict) {
      setError("Please select your district");
      return;
    }

    if (!user) {
      setError("You must be logged in to save your location");
      return;
    }

    setSaving(true);
    setError(null);
    setIsNavigatingToStep3(true);

    try {
      const response = await upsertUserAddress({
        state: selectedState,
        district: selectedDistrict,
        country: "India", // Default to India
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
          {/* Robot */}
          <div className="flex-shrink-0">
            <Robot variant="five" />
          </div>

          {/* Select + Button */}
          <div className="flex flex-col gap-5 w-full max-w-xl">
            <Bubble>Where are you located? Select your state and district.</Bubble>

            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
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

              <Button
                type="submit"
                variant="DarkGradient"
                size="lg"
                className="w-full rounded-full"
                disabled={saving || !selectedState || !selectedDistrict}
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

