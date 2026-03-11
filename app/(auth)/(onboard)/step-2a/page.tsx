'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button, Select, SelectOption } from "@/components/shared";
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
  const { user, refreshUser, isLoading } = useAuth();

  // Fetch streams on mount
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        setLoadingStreams(true);
        const response = await getAllStreamsPublic();
        if (response.success && response.data) {
          const options = response.data.streams.map(stream => ({
            value: stream.id.toString(),
            label: stream.name
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

  // Redirect to dashboard if user has completed onboarding
  useEffect(() => {
    if (!isLoading && user?.onboarding_completed && !isNavigatingToStep2B && !saving) {
      setIsRedirecting(true);
      router.prefetch('/dashboard');
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToStep2B, saving]);

  // Show smooth loader while checking auth or redirecting
  if (isLoading || (isRedirecting && !saving && !isNavigatingToStep2B)) {
    return <OnboardingLoader message={isRedirecting ? "Taking you to dashboard..." : "Loading..."} />;
  }

  // Don't render if user has completed onboarding and we're not saving/navigating
  if (user?.onboarding_completed && !saving && !isNavigatingToStep2B) {
    return <OnboardingLoader message="Taking you to dashboard..." />;
  }

  // Show saving state if we're navigating to step-2b
  if (saving || isNavigatingToStep2B) {
    return <OnboardingLoader message="Saving your stream..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStream) {
      setError("Please select your stream");
      return;
    }

    if (!user) {
      setError("You must be logged in to save your stream");
      return;
    }

    setSaving(true);
    setError(null);
    setIsNavigatingToStep2B(true);

    try {
      const streamId = parseInt(selectedStream);
      if (isNaN(streamId)) {
        throw new Error("Invalid stream selected");
      }

      const response = await updateAcademics({
        stream_id: streamId
      });
      
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

  return (
    <div
      className="h-screen w-full flex flex-col"
      style={{
        background:
          "linear-gradient(90deg, #140E27 0%, #240F3C 50%, #341050 100%)",
      }}
    >
      <WelcomeLayout progress={60}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl mx-auto">
          {/* Robot */}
          <div className="flex-shrink-0">
            <Robot variant="five" />
          </div>

          {/* Select + Button */}
          <div className="flex flex-col gap-5 w-full max-w-xl">
            <Bubble>Which stream are you pursuing or have completed?</Bubble>

            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {loadingStreams ? (
                <div className="w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-slate-400">
                  Loading streams...
                </div>
              ) : streamOptions.length === 0 ? (
                <div className="w-full rounded-full border border-yellow-500/50 bg-yellow-500/10 px-5 py-3 text-sm text-yellow-400">
                  No streams available. Please contact support.
                </div>
              ) : (
                <Select
                  options={streamOptions}
                  value={selectedStream}
                  onChange={(value) => setSelectedStream(value || "")}
                  placeholder="Select your stream"
                  isSearchable={true}
                  isClearable={false}
                />
              )}

              <Button
                type="submit"
                variant="DarkGradient"
                size="lg"
                className="w-full rounded-full"
                disabled={saving || !selectedStream || loadingStreams}
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
