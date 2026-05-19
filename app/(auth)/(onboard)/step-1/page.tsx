'use client'
import { useRouter } from "next/navigation";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import { useOnboardingCompletedGuard } from "@/hooks/useOnboardingCompletedGuard";

export default function StepOne() {
  const router = useRouter();
  const { showCompletedLoader, isRedirecting } = useOnboardingCompletedGuard();

  if (showCompletedLoader) {
    return <OnboardingLoader message={isRedirecting ? "Taking you home..." : "Loading..."} />;
  }

  return (
    <>
      <p className="mb-6 text-sm text-slate-500 leading-relaxed -mt-1">
        Your shortcut to clarity - no more endless research
      </p>

      <button
        onClick={() => router.push("/step-2")}
        className="landing-cta mt-auto w-full rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
      >
        Start Now
      </button>
    </>
  );
}
