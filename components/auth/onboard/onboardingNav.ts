import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { setOnboardingFlowActive } from "@/lib/onboardingFlow";

/** Navigate to a previous onboarding step and keep the flow editable. */
export function goToOnboardingStep(router: AppRouterInstance, path: string): void {
  setOnboardingFlowActive();
  router.push(path);
}
