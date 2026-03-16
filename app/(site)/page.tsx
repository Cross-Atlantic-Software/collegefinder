"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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

  useEffect(() => {
    // If user is authenticated, always go to dashboard
    if (!isLoading && isAuthenticated) {
      router.prefetch("/dashboard");
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loader when we're redirecting to dashboard
  if (isLoading || isAuthenticated) {
    return <OnboardingLoader message="Redirecting..." />;
  }

  return (
    <main className="bg-white">
      <Hero />
      <ScrollRevealSection delayMs={0}>
        <InfoSection />
      </ScrollRevealSection>
      <FeatureStackSection />
      <ScrollRevealSection delayMs={180}>
        <HowItWorksSection />
      </ScrollRevealSection>
      <ScrollRevealSection delayMs={260}>
        <AudienceSection />
      </ScrollRevealSection>
      <ScrollRevealSection delayMs={340}>
        <ContactSection />
      </ScrollRevealSection>
      <ScrollRevealSection delayMs={420}>
        <FaqSection />
      </ScrollRevealSection>
    </main>
  );
}
