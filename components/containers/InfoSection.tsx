"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";
import type { LandingPageContent } from "@/types/landingPage";

export default function InfoSection({ info }: { info: LandingPageContent["info"] }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
    >
      <div className="appContainer">
        <div className="landing-grid-gap grid items-center lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">
              {info.label}
            </p>

            <h2 className="mt-5 text-4xl font-extrabold leading-tight text-black md:text-5xl">
              <span className="text-black/45">
                {info.statsLine}
              </span>
              <br />
              <RoughNotation
                type="highlight"
                show={isVisible}
                color="rgba(240, 197, 68, 0.35)"
                strokeWidth={1}
                padding={4}
                animationDelay={600}
                animationDuration={1400}
                multiline
              >
                {info.highlightQuestion}
              </RoughNotation>
            </h2>

            <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-black/60">
              {info.body}
            </p>

            <Link
              href={info.ctaHref || "/login"}
              className="landing-cta group mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85"
            >
              {info.ctaLabel}
              <FiArrowRight className="landing-icon-slide text-base" />
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[740px]">
            <div className="overflow-hidden rounded-[28px] bg-white p-2">
              <Image
                src="/landing-page/problem1.png"
                alt="Unitracko dashboard preview"
                width={1240}
                height={920}
                className="h-auto w-full rounded-[22px]"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
