"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CareerGuidanceSection, Features, Hero, InfoSection, SmartShortlistSection } from "@/components/containers";
import { Stats } from "@/components/shared";
import Heading from "@/components/shared/Typography";
import Image from "next/image";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function Home() {
  const { isAuthenticated, isLoading, user, userVerifiedFromServer } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Trust localStorage: if user already completed onboarding, go to dashboard immediately
      if (user.onboarding_completed === true) {
        router.prefetch("/dashboard");
        router.replace("/dashboard");
        return;
      }
      // Only send to step-1 when server confirmed they haven't completed (avoid stale "false" in storage)
      if (userVerifiedFromServer && user.onboarding_completed === false) {
        router.prefetch("/step-1");
        router.replace("/step-1");
      }
    }
  }, [isAuthenticated, isLoading, user, userVerifiedFromServer, router]);

  // Show loader when we're redirecting (dashboard or step-1)
  const goToDashboard = isAuthenticated && user?.onboarding_completed === true;
  const goToStep1 = isAuthenticated && userVerifiedFromServer && user && user.onboarding_completed === false;
  if (isLoading || goToDashboard || goToStep1) {
    return <OnboardingLoader message="Redirecting..." />;
  }

  return (
    <main className="dark:bg-[#050816]">
      <Hero />
      <section className="appContainer py-20">
        <Heading align="center" subHead="A Hub of Excellence" head="Education, Research, and Innovation"/>
        <Stats className="mt-10" />
      </section>
      <InfoSection />
      <Features />
      <CareerGuidanceSection />
      <SmartShortlistSection />
      <section className="appContainer py-20">
        <Heading align="center" head="Easy application in 1-click" description="Explore how our university serves as a hub of excellence, bringing together top-tier education, cutting-edge research, and groundbreaking innovation to transform the world."/>
        <Image src="/easy-application.webp" alt="easy-application" width={1600} height={788} className="mt-8 max-w-5xl mx-auto" />
      </section>
    </main>
  );
}
