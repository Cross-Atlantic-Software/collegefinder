"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";
import type { LandingPageContent } from "@/types/landingPage";
import { useAuth } from "@/contexts/AuthContext";

export default function Hero({ hero }: { hero: LandingPageContent["hero"] }) {
    const sectionRef = useRef<HTMLElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const { isAuthenticated } = useAuth();

    const ctaHref = isAuthenticated
        ? "/dashboard?section=know-your-strengths"
        : "https://unitracko.com/strengths-directory";

    useEffect(() => {
        const check = () => {
          setIsMobile(window.innerWidth <= 767);
        };

        queueMicrotask(() => check());
        window.addEventListener("resize", check);
      
        return () => window.removeEventListener("resize", check);
      }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Some browsers can invoke callbacks in the same turn as observe(); defer to avoid
                    // "state update before mount" warnings with React concurrent rendering + RoughNotation.
                    queueMicrotask(() => {
                        setIsVisible(true);
                        observer.disconnect();
                    });
                }
            },
            { threshold: 0.3 }
        );
        const el = sectionRef.current;
        if (el) observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            id="home"
            ref={sectionRef}
            className="relative isolate min-h-[100svh] overflow-hidden scroll-mt-20 md:scroll-mt-24"
        >
         <video
         key={isMobile ? "mobile" : "desktop"}
  className="absolute inset-0 h-full w-full object-cover object-center"
  autoPlay
  loop
  muted
  playsInline
  preload="metadata"
  poster="/landing-page/hero-1.png"
  aria-hidden="true"
>
  <source
    src={
      isMobile
        ? "/landing-page/unitracko-ai-verticle.mp4"
        : "/landing-page/unitracko-ai.mp4"
    }
    type="video/mp4"
  />
</video>
            <div className="absolute inset-0 bg-black/50" />
        
            <div className="appContainer relative z-10 flex min-h-[100svh] items-end py-12 sm:py-16 md:py-20 lg:pb-24">
                <div className="max-w-2xl pb-[calc(env(safe-area-inset-bottom)+0.25rem)]  md:pb-0">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white sm:text-sm">
                        Student-First Decision Intelligence Platform
                    </p>

                    <h1 className="text-[1.6rem] font-extrabold leading-[1.12] text-white sm:text-3xl md:text-5xl">
                        <span className="text-[#f0c544]">
                            <span className="block">Your Future.</span>
                            <span className="block">Your Choices.</span>
                            <span className="block">Your Decision.</span>
                        </span>
                    </h1>

                    <p className="mt-4 text-base font-medium text-white/90 sm:text-lg">
                        From Aspirations to Admissions.
                    </p>

                    {/* <div className="mt-7 grid w-full gap-3 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-5 md:gap-8">
                        {pains.map((label, i) => {
                            const Icon = painIcons[i] ?? painIcons[0];
                            return (
                            <div
                                key={`${label}-${i}`}
                                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white"
                            >
                                <span className="inline-flex h-8 w-8 items-center justify-center text-white sm:h-9 sm:w-9">
                                    <Icon className="text-[14px] sm:text-[15px]" />
                                </span>
                                <span>{label}</span>
                            </div>
                            );
                        })}
                    </div> */}

                    <Link
                        href={ctaHref}
                        className="landing-cta group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 sm:w-auto"
                    >
                        {hero.ctaLabel || "Find My Fit"}
                        <FiArrowUpRight className="landing-icon-slide text-base" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
