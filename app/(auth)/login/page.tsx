"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell, LoginStepOneForm } from "@/components/auth";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import { FiCheckCircle } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";

export default function LoginStepOnePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showNotation, setShowNotation] = useState(false);

  useEffect(() => {
    // If user is authenticated, always go to dashboard
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowNotation(true), 250);
    return () => window.clearTimeout(timer);
  }, []);

  // Show loader while checking auth or redirecting
  if (isLoading || isAuthenticated) {
    return <OnboardingLoader message="Redirecting to dashboard..." />;
  }

  return (
    <AuthShell variant="minimal" contentClassName="items-start lg:items-center">
      <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,460px)] lg:items-center lg:gap-14">
        <section className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Welcome Back
          </p>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Continue your
            <span className="mt-1 block text-slate-900">
              <RoughNotation
                type="underline"
                show={showNotation}
                color="#f0c544"
                strokeWidth={3}
                padding={3}
                animationDelay={300}
                animationDuration={1200}
              >
                <span>admission journey</span>
              </RoughNotation>
            </span>
            without missing a step.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            One quick OTP and your entire exam, college, and application plan is
            right where you left it.
          </p>

          <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
            <svg
              width="74"
              height="24"
              viewBox="0 0 74 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="doodle-float"
              aria-hidden="true"
            >
              <path
                d="M2 20C17 4 35 2 53 10C58 12 63 15 70 7"
                stroke="#0f172a"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="doodle-path"
              />
              <path
                d="M65 6L70 7L68 12"
                stroke="#0f172a"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="doodle-path"
              />
            </svg>
            <span>Fast sign in, zero clutter</span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Track forms and deadlines in one place",
              "Get personalized college guidance",
              "Plan exams with less stress",
              "Never lose your admission timeline",
            ].map((point) => (
              <div
                key={point}
                className="inline-flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <FiCheckCircle className="mt-0.5 flex-shrink-0 text-slate-900" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex w-full justify-center">
          <LoginStepOneForm />
        </div>
      </div>
    </AuthShell>
  );
}
