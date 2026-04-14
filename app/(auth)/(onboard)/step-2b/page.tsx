'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button, useToast } from "@/components/shared";
import { updateCareerGoals, getAllCareerGoalsPublic, getAcademics } from "@/api";
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
  const [needsStream, setNeedsStream] = useState(false);
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const { showError } = useToast();

  // Fetch interests for the stream chosen in step-2a (saved on user academics)
  useEffect(() => {
    const fetchCareerGoals = async () => {
      try {
        setLoadingInterests(true);
        setNeedsStream(false);
        const acRes = await getAcademics();
        const streamId = acRes.success && acRes.data?.stream_id != null ? acRes.data.stream_id : null;
        if (!streamId || streamId < 1) {
          setNeedsStream(true);
          setInterestOptions([]);
          return;
        }
        const response = await getAllCareerGoalsPublic(streamId);
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

  useEffect(() => {
    if (!needsStream || isLoading) return;
    const t = setTimeout(() => {
      router.replace("/step-2a");
    }, 800);
    return () => clearTimeout(t);
  }, [needsStream, isLoading, router]);

  // Redirect to home if user has completed onboarding
  useEffect(() => {
    if (!isLoading && user?.onboarding_completed && !isNavigatingToStep3 && !saving) {
      setIsRedirecting(true);
      router.prefetch('/');
      const timer = setTimeout(() => {
        router.replace('/');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToStep3, saving]);

  // Show smooth loader while checking auth or redirecting
  if (isLoading || needsStream || (isRedirecting && !saving && !isNavigatingToStep3)) {
    return (
      <OnboardingLoader
        message={
          needsStream
            ? "Taking you back to choose your stream..."
            : isRedirecting
              ? "Taking you home..."
              : "Loading..."
        }
      />
    );
  }

  // Don't render if user has completed onboarding and we're not saving/navigating
  if (user?.onboarding_completed && !saving && !isNavigatingToStep3) {
    return <OnboardingLoader message="Taking you home..." />;
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
        await refreshUser(); // Update context + localStorage with onboarding_completed state.
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
    <div className="h-screen w-full flex flex-col bg-[#F6F8FA]">
      <WelcomeLayout progress={80}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl mx-auto">
          {/* Robot */}
          <div className="flex-shrink-0">
            <Robot variant="five" />
          </div>

          {/* Interests + Button */}
          <div className="flex flex-col gap-5 w-full max-w-2xl">
            <Bubble className="w-full max-w-none flex-col items-start gap-0.5">
              <div className="font-medium">What interests you? Select all that apply.</div>
              <div className="text-sm text-slate-500 font-normal mt-0.5">You can choose up to 3 interests.</div>
            </Bubble>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {loadingInterests ? (
              <div className="w-full rounded-2xl bg-white border border-slate-200 p-6 text-center text-slate-400">
                Loading interests...
              </div>
            ) : interestOptions.length === 0 ? (
              <div className="w-full rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center text-sm text-amber-900">
                No interests are set up for your stream yet. Please contact support or try another stream in the previous step.
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
                            "flex flex-col items-center justify-center rounded-2xl p-5 text-center transition-all duration-200 min-h-[140px] w-full border group",
                            active
                              ? "bg-[#341050] text-white border-[#341050] shadow-lg shadow-[#341050]/20"
                              : "bg-white border-slate-200 hover:border-[#341050]/40 hover:shadow-sm",
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
                            <div className={`mb-2 h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center ${active ? "bg-white/20" : "bg-slate-100"}`}>
                              <span className={`text-lg font-bold ${active ? "text-white" : "text-slate-500"}`}>{opt.label.charAt(0)}</span>
                            </div>
                          )}
                          <span
                            className={`text-sm font-semibold leading-tight break-words transition-all duration-200 ${active ? "text-white" : "text-slate-700 group-hover:text-slate-900"}`}
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
