'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { WelcomeLayout } from "@/components/auth/onboard";
import { useToast } from "@/components/shared";
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
            logo: cg.logo,
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
    const t = setTimeout(() => { router.replace("/step-2a"); }, 800);
    return () => clearTimeout(t);
  }, [needsStream, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user?.onboarding_completed && !isNavigatingToStep3 && !saving) {
      setIsRedirecting(true);
      router.prefetch('/');
      const timer = setTimeout(() => { router.replace('/'); }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToStep3, saving]);

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
  if (user?.onboarding_completed && !saving && !isNavigatingToStep3) {
    return <OnboardingLoader message="Taking you home..." />;
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
    if (selectedInterests.length === 0) { setError("Please select at least one interest"); return; }
    if (selectedInterests.length > 3)   { setError("Please select up to 3 interests only"); return; }
    if (!user) { setError("You must be logged in to save your interests"); return; }

    setSaving(true);
    setError(null);
    setIsNavigatingToStep3(true);

    try {
      const interests = selectedInterests.map(id => id.toString());
      const response = await updateCareerGoals({ interests });
      if (response.success) {
        await refreshUser();
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

  const isBusy = saving || isNavigatingToStep3;

  return (
    <WelcomeLayout
      progress={80}
      isLoading={isBusy}
      scribbleTitle="Your"
      scribbleSuffix="interests"
    >
      {!isBusy && (
        <>
          <p className="mb-1 text-sm text-slate-500 -mt-1">Select what excites you most.</p>
          <p className="mb-4 text-xs font-semibold text-slate-400">
            {selectedInterests.length}/3 selected
          </p>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {loadingInterests ? (
              /* Inline shimmer grid while loading */
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl shimmer-skeleton" />
                ))}
              </div>
            ) : interestOptions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-center text-sm text-amber-700">
                <p>No interests are currently available for this stream.</p>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-full border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-800 transition hover:bg-amber-100 active:scale-95"
                >
                  ← Go back to stream
                </button>
              </div>
            ) : (
              <div className="max-h-[240px] overflow-y-auto scrollbar-hide pr-0.5 -mx-1 px-1">
                <div className="grid grid-cols-3 gap-2.5">
                  {interestOptions.map((opt) => {
                    const active = selectedInterests.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleInterest(opt.id)}
                        className={[
                          "flex flex-col items-center justify-center rounded-2xl p-3 text-center transition-all duration-200 min-h-[72px] border",
                          active
                            ? "bg-[#f0c544] border-[#f0c544] text-slate-900 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm",
                        ].join(" ")}
                      >
                        {opt.logo ? (
                          <Image
                            src={opt.logo}
                            alt={opt.label}
                            width={28}
                            height={28}
                            className="mb-1.5 h-7 w-7 object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="mb-1.5 text-base font-bold text-slate-700">
                            {opt.label.charAt(0)}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
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
                disabled={saving || selectedInterests.length === 0 || loadingInterests}
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
