"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoughNotation } from "react-rough-notation";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import eyeAnim from "@/public/LottieiCONS/doodle-black-221-eye-hover-pinch.json";
import idCardAnim from "@/public/LottieiCONS/doodle-black-16-id-business-card-hover-pinch.json";
import folderUserAnim from "@/public/LottieiCONS/doodle-black-714-folder-user-hover-pinch.json";


type WelcomeLayoutProps = {
  children: ReactNode;
  progress: number; // 0–100
  scribbleTitle?: string;
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

function DelayedLottie({ animationData, className }: { animationData: any; className?: string }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  
  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={false}
      onComplete={() => {
        setTimeout(() => {
          lottieRef.current?.goToAndPlay(0, true);
        }, 1500); // 1.5s delay between loops
      }}
      className={className}
    />
  );
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
  scribbleTitle,
  scribbleSuffix,
}: WelcomeLayoutProps) {
  const currentStep = getStepIndex(progress);
  const [scribbleVisible, setScribbleVisible] = useState(false);
  const router = useRouter();

  // Trigger scribble animation after mount
  useEffect(() => {
    const t = setTimeout(() => setScribbleVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Reset scribble when step changes
  useEffect(() => {
    setScribbleVisible(false);
    const t = setTimeout(() => setScribbleVisible(true), 400);
    return () => clearTimeout(t);
  }, [progress]);

  return (
    <div className="relative isolate flex min-h-screen w-full flex-col overflow-hidden text-slate-900 bg-white">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-[-1] h-full w-full object-cover pointer-events-none"
      >
        <source src="/Animated_Student_s_Career_Journey_Video.mp4" type="video/mp4" />
      </video>
      <style>{`
        @keyframes slideFade {
          0% { opacity: 0; transform: translateY(8px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-fade {
          animation: slideFade 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {/* Main */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        {/* Narrow column — card is taller than wide at ~420px */}
        <div className="flex w-full max-w-[440px] flex-col gap-5">
          <div className="relative mt-2 mb-2">
            {/* Blue offset background card */}
            <div className="absolute -bottom-3 -left-3 z-0 h-full w-full rounded-[20px] bg-sky-200" />
            {/* Yellow offset background card */}
            <div className="absolute -top-3 -right-3 z-0 h-full w-full rounded-[20px] bg-[#f0c544]/60" />
            <div className="relative z-10 rounded-[20px] border-2 border-black bg-white p-7 shadow-sm">
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
                      <RoughNotation
                        type="circle"
                        show={isActive && scribbleVisible}
                        color="#000"
                        strokeWidth={2}
                        padding={4}
                        animationDuration={600}
                      >
                        <div
                          className={[
                            "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ring-2",
                            isActive
                              ? "bg-[#f0c544] text-slate-900 ring-transparent"
                              : isDone
                                ? "bg-[#f0c544] text-slate-900 ring-black"
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
                      </RoughNotation>
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
            {scribbleTitle && (
              <div className="mb-5 flex items-center gap-3">
                <DelayedLottie
                  animationData={
                    currentStep === 1 || currentStep === 4
                      ? idCardAnim
                      : currentStep === 2 || currentStep === 5
                        ? folderUserAnim
                        : eyeAnim
                  }
                  className="w-10 h-10 shrink-0"
                />
                <h1 className="text-[1.35rem] font-extrabold leading-tight text-slate-900">
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
              </div>
            )}

            <div key={currentStep} className="animate-slide-fade">
              {children}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
