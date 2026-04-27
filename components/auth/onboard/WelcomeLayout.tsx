"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoughNotation } from "react-rough-notation";

type WelcomeLayoutProps = {
  children: ReactNode;
  progress: number; // 0–100
  isLoading?: boolean;
  /** Title to highlight with scribble underline */
  scribbleTitle?: string;
  /** Rest of heading after the scribble word */
  scribbleSuffix?: string;
};

const STEPS = [
  { label: "Welcome"   },
  { label: "Profile"   },
  { label: "Stream"    },
  { label: "Interests" },
  { label: "Location"  },
  { label: "Finish"    },
];

function getStepIndex(progress: number): number {
  if (progress <= 20)  return 0;
  if (progress <= 40)  return 1;
  if (progress <= 60)  return 2;
  if (progress <= 80)  return 3;
  if (progress <= 95)  return 4;
  return 5;
}

/** Card-level shimmer skeleton for in-card loading states */
export function CardShimmer() {
  return (
    <div className="flex flex-col gap-4 w-full animate-pulse">
      <div className="h-5 w-1/2 rounded-full shimmer-skeleton" />
      <div className="h-4 w-3/4 rounded-full shimmer-skeleton" />
      <div className="h-12 w-full rounded-2xl shimmer-skeleton mt-2" />
      <div className="h-12 w-full rounded-full shimmer-skeleton" />
    </div>
  );
}

export function WelcomeLayout({
  children,
  progress,
  isLoading = false,
  scribbleTitle,
  scribbleSuffix,
}: WelcomeLayoutProps) {
  const currentStep = getStepIndex(progress);
  const [scribbleVisible, setScribbleVisible] = useState(false);
  const router = useRouter();

  // Trigger scribble animation after mount (mimics landing page IntersectionObserver pattern)
  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setScribbleVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  // Reset scribble when step changes
  useEffect(() => {
    setScribbleVisible(false);
    const t = setTimeout(() => setScribbleVisible(true), 400);
    return () => clearTimeout(t);
  }, [progress]);

  return (
    <div className="relative isolate flex min-h-screen w-full flex-col overflow-hidden text-slate-900">
      {/* Background — identical to login page */}
      <Image
        src="/login-3.png"
        alt="Background"
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-white/72 backdrop-blur-[1px]" />

      <div className="absolute inset-0 bg-white/72 backdrop-blur-[1px]" />

      {/* Main */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        {/* Narrow column — card is taller than wide at ~420px */}
        <div className="flex w-full max-w-[440px] flex-col gap-5">

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            {/* ── Stepper ── */}
            <div className="flex items-center mb-7">
              {STEPS.map((step, idx) => {
                const isDone   = idx < currentStep;
                const isActive = idx === currentStep;
                return (
                  <div key={step.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full items-center">
                      <div
                        className={[
                          "h-px flex-1 transition-all duration-500",
                          idx === 0 ? "invisible" : "",
                          isDone || isActive ? "bg-[#f0c544]" : "bg-slate-200",
                        ].join(" ")}
                      />
                      <div
                        className={[
                          "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ring-2",
                          isActive
                            ? "bg-[#f0c544] text-slate-900 ring-[#f0c544]/30 shadow-sm"
                            : isDone
                              ? "bg-[#f0c544] text-slate-900 ring-transparent"
                              : "bg-white text-slate-400 ring-slate-200",
                        ].join(" ")}
                      >
                        {isDone ? (
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M3.5 8.5l3 3 6-6"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div
                        className={[
                          "h-px flex-1 transition-all duration-500",
                          idx === STEPS.length - 1 ? "invisible" : "",
                          isDone ? "bg-[#f0c544]" : "bg-slate-200",
                        ].join(" ")}
                      />
                    </div>
                    <span
                      className={[
                        "text-[9px] font-semibold uppercase tracking-wide transition-colors duration-300 hidden sm:block",
                        isActive
                          ? "text-slate-800"
                          : isDone
                            ? "text-slate-500"
                            : "text-slate-300",
                      ].join(" ")}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Optional scribble heading */}
            {scribbleTitle && !isLoading && (
              <h1 className="mb-5 text-[1.35rem] font-extrabold leading-tight text-slate-900">
                <RoughNotation
                  type="underline"
                  show={scribbleVisible}
                  color="#f0c544"
                  strokeWidth={3}
                  padding={3}
                  animationDelay={500}
                  animationDuration={900}
                >
                  <span className="text-slate-900">{scribbleTitle}</span>
                </RoughNotation>
                {scribbleSuffix && (
                  <span className="text-slate-900"> {scribbleSuffix}</span>
                )}
              </h1>
            )}

            {isLoading ? <CardShimmer /> : children}
          </div>
        </div>
      </div>
    </div>
  );
}
