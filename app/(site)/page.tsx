"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getLandingPageContent, getPublicTestimonials, type PublicTestimonial } from "@/api";
import type { LandingPageContent } from "@/types/landingPage";
import {
  AudienceSection,
  ContactSection,
  FaqSection,
  TestimonialsSection,
  FeatureStackSection,
  Hero,
  HowItWorksSection,
  InfoSection,
} from "@/components/containers";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import ScrollRevealSection from "@/components/shared/ScrollRevealSection";
import { scrollToLandingSection } from "@/lib/landingNav";

export default function Home() {
  const { isLoading } = useAuth();
  const [landing, setLanding] = useState<LandingPageContent | null>(null);
  const [landingError, setLandingError] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);

  useEffect(() => {
    if (isLoading) return;

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
      try {
        const tRes = await getPublicTestimonials();
        if (cancelled) return;
        if (tRes.success && tRes.data?.testimonials) {
          setTestimonials(tRes.data.testimonials);
        }
      } catch {
        /* testimonials optional; landing still works */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  /** After CMS content mounts, honor #hash (e.g. from /blogs → /#get-in-touch). */
  useEffect(() => {
    if (!landing) return;
    const raw = window.location.hash?.replace(/^#/, "").trim();
    if (!raw) return;

    const run = () => scrollToLandingSection(raw);

    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });

    const onHashChange = () => {
      const id = window.location.hash?.replace(/^#/, "").trim();
      if (id) scrollToLandingSection(id);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [landing]);

  if (isLoading) {
    return <OnboardingLoader message="Loading..." />;
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
      <div id="our-edge" className="scroll-mt-20 md:scroll-mt-24">
        <ScrollRevealSection delayMs={180}>
          <HowItWorksSection howItWorks={landing.howItWorks} />
        </ScrollRevealSection>
        <ScrollRevealSection delayMs={260}>
          <AudienceSection audience={landing.audience} />
        </ScrollRevealSection>
      </div>
      <div id="get-in-touch" className="scroll-mt-20 md:scroll-mt-24">
        <ScrollRevealSection delayMs={340}>
          <Suspense
            fallback={
              <section className="landing-section scroll-mt-20 bg-white md:scroll-mt-24 min-h-[240px]" aria-hidden />
            }
          >
            <ContactSection contact={landing.contact} />
          </Suspense>
        </ScrollRevealSection>
        <ScrollRevealSection delayMs={380}>
          <TestimonialsSection testimonials={testimonials} copy={landing.testimonials} />
        </ScrollRevealSection>
        <ScrollRevealSection delayMs={420}>
          <FaqSection faq={landing.faq} />
        </ScrollRevealSection>
      </div>
    </main>
  );
}
