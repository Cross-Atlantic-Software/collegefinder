"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getLandingPageContent } from "@/api";
import type { LandingPageContent } from "@/types/landingPage";
import {
  AudienceSection,
  ContactSection,
  FaqSection,
  FeatureStackSection,
  Hero,
  HowItWorksSection,
  InfoSection,
} from "@/components/containers";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import ScrollRevealSection from "@/components/shared/ScrollRevealSection";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [landing, setLanding] = useState<LandingPageContent | null>(null);
  const [landingError, setLandingError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.prefetch("/dashboard");
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    let cancelled = false;
    (async () => {
      setLandingError(null);
      try {
        const res = await getLandingPageContent();
        if (cancelled) return;
        if (res.success && res.data?.content) {
          setLanding(res.data.content);
        } else {
          setLandingError(res.message || "Could not load page content.");
        }
      } catch {
        if (!cancelled) setLandingError("Could not load page content.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated]);

  if (isLoading || isAuthenticated) {
    return <OnboardingLoader message="Redirecting..." />;
  }

  if (!landing && !landingError) {
    return <OnboardingLoader message="Loading..." />;
  }

  if (landingError || !landing) {
    return (
      <main className="bg-white min-h-[50vh] flex items-center justify-center px-4">
        <p className="text-slate-600 text-center max-w-md">{landingError}</p>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <Hero hero={landing.hero} />
      <ScrollRevealSection delayMs={0}>
        <InfoSection info={landing.info} />
      </ScrollRevealSection>
      <FeatureStackSection features={landing.features} />
      <ScrollRevealSection delayMs={180}>
        <HowItWorksSection howItWorks={landing.howItWorks} />
      </ScrollRevealSection>
      <ScrollRevealSection delayMs={260}>
        <AudienceSection audience={landing.audience} />
      </ScrollRevealSection>
      <ScrollRevealSection delayMs={340}>
        <ContactSection contact={landing.contact} />
      </ScrollRevealSection>
      <ScrollRevealSection delayMs={420}>
        <FaqSection faq={landing.faq} />
      </ScrollRevealSection>
    </main>
  );
}
