'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardShimmer } from "@/components/auth/onboard/WelcomeLayout";
import { Select, SelectOption } from "@/components/shared";
import { updateAcademics, getAllStreamsPublic } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function StepTwoA() {
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [streamOptions, setStreamOptions] = useState<SelectOption[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isNavigatingToStep2B, setIsNavigatingToStep2B] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        setLoadingStreams(true);
        const response = await getAllStreamsPublic();
        if (response.success && response.data) {
          const options = response.data.streams.map(stream => ({
            value: stream.id.toString(),
            label: stream.name,
          }));
          setStreamOptions(options);
        }
      } catch (err) {
        console.error("Error fetching streams:", err);
        setError("Failed to load streams. Please try again.");
      } finally {
        setLoadingStreams(false);
      }
    };
    fetchStreams();
  }, []);

  useEffect(() => {
    if (!isLoading && user?.onboarding_completed && !isNavigatingToStep2B && !saving) {
      setIsRedirecting(true);
      router.prefetch('/');
      const timer = setTimeout(() => { router.replace('/'); }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToStep2B, saving]);

  if (isLoading || (isRedirecting && !saving && !isNavigatingToStep2B)) {
    return <OnboardingLoader message={isRedirecting ? "Taking you home..." : "Loading..."} />;
  }
  if (user?.onboarding_completed && !saving && !isNavigatingToStep2B) {
    return <OnboardingLoader message="Taking you home..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream) { setError("Please select your stream"); return; }
    if (!user)            { setError("You must be logged in"); return; }

    setSaving(true);
    setError(null);
    setIsNavigatingToStep2B(true);

    try {
      const streamId = parseInt(selectedStream);
      if (isNaN(streamId)) throw new Error("Invalid stream selected");

      const response = await updateAcademics({ stream_id: streamId });
      if (response.success) {
        router.prefetch("/step-2b");
        router.replace("/step-2b");
      } else {
        setError(response.message || "Failed to save stream. Please try again.");
        setSaving(false);
        setIsNavigatingToStep2B(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error updating academics:", err);
      setSaving(false);
      setIsNavigatingToStep2B(false);
    }
  };

  const isBusy = saving || isNavigatingToStep2B;

  if (isBusy) return <CardShimmer />;

  return (
    <>
      {!isBusy && (
        <>
          <p className="mb-5 text-sm text-slate-500 -mt-1">
            Select the stream you&apos;re pursuing or have completed.
          </p>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {loadingStreams ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[72px] rounded-2xl shimmer-skeleton" />
                ))}
              </div>
            ) : streamOptions.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No streams available. Please contact support.
              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto scrollbar-hide -mx-1 px-1">
                <div className="grid grid-cols-2 gap-3">
                  {streamOptions.map((opt) => {
                    const active = selectedStream === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedStream(opt.value)}
                        className={[
                          "flex flex-col items-center justify-center rounded-2xl p-4 text-center transition-all duration-200 min-h-[76px] border",
                          active
                            ? "bg-[#f0c544] border-[#f0c544] text-slate-900 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm hover:text-slate-800",
                        ].join(" ")}
                      >
                        <span className="text-[13px] font-bold leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                disabled={saving || !selectedStream || loadingStreams}
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
