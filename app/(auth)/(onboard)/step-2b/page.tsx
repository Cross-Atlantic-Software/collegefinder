'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button, useToast } from "@/components/shared";
import { updateCareerGoals, getAllCareerGoalsPublic } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

interface CareerGoalOption {
  id: string;
  label: string;
  logo?: string | null;
}

export default function StepTwoB() {
  const [interestOptions, setInterestOptions] = useState<CareerGoalOption[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isNavigatingToStep3, setIsNavigatingToStep3] = useState(false);
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const { showError } = useToast();

  // Fetch career goals on mount
  useEffect(() => {
    const fetchCareerGoals = async () => {
      try {
        setLoadingInterests(true);
        const response = await getAllCareerGoalsPublic();
        if (response.success && response.data) {
          const options = response.data.careerGoals.map(cg => ({
            id: cg.id.toString(),
            label: cg.label,
            logo: cg.logo
          }));
          setInterestOptions(options);
        }
      } catch (err) {
        console.error("Error fetching career goals:", err);
        setError("Failed to load interests. Please try again.");
      } finally {
        setLoadingInterests(false);
      }
    };

    fetchCareerGoals();
  }, []);

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
    return <OnboardingLoader message="Saving your interests..." />;
  }

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests((prev) => prev.filter((x) => x !== id));
      return;
    }
    if (selectedInterests.length >= 3) {
      queueMicrotask(() => showError("You can choose up to 3 interests only."));
      return;
    }
    setSelectedInterests((prev) => [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedInterests.length === 0) {
      setError("Please select at least one interest");
      return;
    }
    if (selectedInterests.length > 3) {
      setError("Please select up to 3 interests only");
      return;
    }

    if (!user) {
      setError("You must be logged in to save your interests");
      return;
    }

    setSaving(true);
    setError(null);
    setIsNavigatingToStep3(true);

    try {
      const interests = selectedInterests.map(id => id.toString());
      const response = await updateCareerGoals({
        interests: interests,
      });

      if (response.success) {
        await refreshUser(); // Update context + localStorage with onboarding_completed: true so next visit goes to dashboard
        router.prefetch("/step-2c");
        router.replace("/step-2c");
      } else {
        setError(response.message || "Failed to save interests. Please try again.");
        setSaving(false);
        setIsNavigatingToStep3(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error updating career goals:", err);
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
      <WelcomeLayout progress={80}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl mx-auto">
          {/* Robot */}
          <div className="flex-shrink-0">
            <Robot variant="five" />
          </div>

          {/* Interests + Button */}
          <div className="flex flex-col gap-5 w-full max-w-2xl">
            <Bubble className="w-full max-w-none">
              <span className="block mb-2">What interests you? Select all that apply.</span>
              <span className="block text-sm text-slate-400 font-normal">You can choose up to 3 interests.</span>
            </Bubble>

            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {loadingInterests ? (
              <div className="w-full rounded-md bg-white/10 p-6 text-center text-slate-400">
                Loading interests...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="max-h-[400px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {interestOptions.map((opt) => {
                      const active = selectedInterests.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleInterest(opt.id)}
                          className={[
                            "flex flex-col items-center justify-center rounded-lg p-5 text-center transition-all duration-200 min-h-[140px] w-full border group",
                            active
                              ? "bg-pink text-white border-pink shadow-lg shadow-pink/20"
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
                          ].join(" ")}
                        >
                          {opt.logo ? (
                            <Image
                              src={opt.logo}
                              alt={opt.label}
                              width={60}
                              height={60}
                              className="mb-2 h-14 w-14 object-contain sm:h-16 sm:w-16"
                              priority
                              unoptimized
                            />
                          ) : (
                            <div className="mb-2 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/20 flex items-center justify-center">
                              <span className="text-lg font-bold text-slate-400">{opt.label.charAt(0)}</span>
                            </div>
                          )}
                          <span
                            className={`text-sm font-semibold leading-tight break-words transition-all duration-200 ${active ? "text-white" : "text-slate-200 group-hover:text-white"}`}
                          >
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="DarkGradient"
                  size="lg"
                  className="w-full rounded-full min-h-[48px]"
                  disabled={saving || selectedInterests.length === 0 || loadingInterests}
                >
                  {saving ? "Saving..." : "Continue"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </WelcomeLayout>
    </div>
  );
}
