'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button } from "@/components/shared";
import { updateProfile } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function StepTwo() {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isNavigatingToStep3, setIsNavigatingToStep3] = useState(false);
  const router = useRouter();
  const { user, refreshUser, isLoading } = useAuth();

  // Redirect to dashboard if user already has a name (completed onboarding)
  // But NEVER redirect if we're saving or navigating to step-3
  useEffect(() => {
    // Only redirect if we're not in the middle of saving or navigating to step-3
    if (!isLoading && user?.name && !isNavigatingToStep3 && !saving) {
      setIsRedirecting(true);
      // Prefetch dashboard for faster loading
      router.prefetch('/dashboard');
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, isNavigatingToStep3, saving]);

  // Show smooth loader while checking auth or redirecting (but NEVER while saving/navigating to step-3)
  if (isLoading || (isRedirecting && !saving && !isNavigatingToStep3)) {
    return <OnboardingLoader message={isRedirecting ? "Taking you to dashboard..." : "Loading..."} />;
  }

  // Don't render if user has name and we're not saving/navigating to step-3
  if (user?.name && !saving && !isNavigatingToStep3) {
    return <OnboardingLoader message="Taking you to dashboard..." />;
  }

  // Show saving state if we're navigating to step-3
  if (saving || isNavigatingToStep3) {
    return <OnboardingLoader message="Saving your name..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      setError("Please enter your name");
      return;
    }

    if (!user) {
      setError("You must be logged in to save your name");
      return;
    }

    setSaving(true);
    setError(null);
    setIsNavigatingToStep3(true); // Set flag immediately to prevent any redirects

    try {
      const response = await updateProfile(name);
      
      if (response.success) {
        // Prefetch step-3 for faster loading
        router.prefetch("/step-3");
        // Navigate to step-3 immediately - don't refresh user data here
        // The user data will be updated naturally when step-3 loads
        router.replace("/step-3");
      } else {
        setError(response.message || "Failed to save name. Please try again.");
        setSaving(false);
        setIsNavigatingToStep3(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error updating profile:", err);
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
      <WelcomeLayout progress={66}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl mx-auto">
          {/* Robot */}
          <div className="flex-shrink-0">
            <Robot variant="five" />
          </div>

          {/* Input + Button */}
          <div className="flex flex-col gap-5 w-full max-w-xl">
            <Bubble>I am curious. What shall I call you?</Bubble>

            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                placeholder="Type your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-pink focus:outline-none transition duration-500"
                required
                minLength={1}
                maxLength={255}
              />

              <Button
                type="submit"
                variant="DarkGradient"
                size="lg"
                className="w-40 rounded-full"
                disabled={saving || !name}
              >
                {saving ? "Saving..." : "Sounds Good"}
              </Button>
            </form>
          </div>
        </div>
      </WelcomeLayout>
    </div>
  );
}
