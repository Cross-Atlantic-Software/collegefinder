"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft, FiLock } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";

const STRENGTHS_PREVIEW_IMAGE = "/know-your-strength.png";

export default function StrengthsDirectoryDiscovery() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          queueMicrotask(() => setHeadingVisible(true));
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="bg-gradient-to-b from-amber-100/50 via-white to-white">
      <section className="scroll-mt-20 pb-6 pt-4 md:scroll-mt-24 md:pb-8 md:pt-5">
        <div className="appContainer">
          <Link
            href="/#the-playbook"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/70 transition-colors hover:text-black sm:text-sm"
          >
            <FiArrowLeft aria-hidden />
            Back to The Playbook
          </Link>

          <div ref={headerRef} className="mx-auto mt-3 text-center md:mt-4">
            <h2 className="text-2xl font-extrabold leading-snug text-black sm:text-3xl">
              <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
                Know Your{" "}
                <RoughNotation
                  type="underline"
                  show={headingVisible}
                  color="#f0c544"
                  strokeWidth={3}
                  padding={3}
                  animationDelay={500}
                  animationDuration={1500}
                >
                  <span className="inline-block">Strengths Early</span>
                </RoughNotation>
              </span>
            </h2>
            <p className="mt-3 text-xs text-black/50 sm:text-sm">
              Build a deeper profile to understand your strengths, preferences, and ideal career
              paths.
            </p>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-3xl bg-amber-100 ring-1 ring-black/[0.07]">
            <div className="pointer-events-none select-none blur-[2px]">
              <div className="relative aspect-[16/10] w-full md:aspect-[16/9]">
                <Image
                  src={STRENGTHS_PREVIEW_IMAGE}
                  alt="Know your strengths assessment preview"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/25 px-6">
              <div className="rounded-full bg-white p-4 shadow-md ring-1 ring-black/10">
                <FiLock className="h-7 w-7 text-slate-600" aria-hidden />
              </div>
              <p className="mt-4 max-w-md text-center text-sm font-semibold text-slate-900">
                Go beyond marks and find where you truly belong.
              </p>
              <Link
                href="/signup"
                className="landing-cta mt-5 inline-flex items-center justify-center rounded-full border border-black/30 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                Take the assessment
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
