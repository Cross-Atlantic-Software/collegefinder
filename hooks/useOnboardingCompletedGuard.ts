"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  canStayOnOnboardingStep,
  consumeBackFromReferralFlag,
} from "@/lib/onboardingFlow";

type Options = {
  saving?: boolean;
  isNavigatingForward?: boolean;
  fromReferralQuery?: boolean;
};

/**
 * Blocks auto-redirect to home when onboarding_completed is true but the user
 * is still moving through (or revisiting) the step flow via Back.
 */
export function useOnboardingCompletedGuard(options: Options = {}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [allowFromReferralBack] = useState(() => consumeBackFromReferralFlag());
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { saving = false, isNavigatingForward = false, fromReferralQuery = false } =
    options;

  const canStay = canStayOnOnboardingStep(user?.onboarding_completed, {
    fromReferralQuery,
    allowFromReferralBack,
  });

  const shouldRedirectHome =
    !isLoading &&
    Boolean(user?.onboarding_completed) &&
    !canStay &&
    !isNavigatingForward &&
    !saving;

  useEffect(() => {
    if (!shouldRedirectHome) return;
    queueMicrotask(() => setIsRedirecting(true));
    router.prefetch("/");
    const timer = setTimeout(() => router.replace("/"), 100);
    return () => clearTimeout(timer);
  }, [shouldRedirectHome, router]);

  const blockedByCompleted =
    Boolean(user?.onboarding_completed) && !canStay && !saving && !isNavigatingForward;

  const showCompletedLoader =
    isLoading ||
    (isRedirecting && !saving && !isNavigatingForward) ||
    blockedByCompleted;

  return {
    user,
    isLoading,
    canStay,
    allowFromReferralBack,
    showCompletedLoader,
    isRedirecting,
    blockedByCompleted,
  };
}
