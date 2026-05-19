/** Session flags so users can move back through onboarding after profile data is saved. */

export const ONBOARDING_FLOW_KEY = "cf_onboarding_flow_active";
export const REFERRAL_STEP_KEY = "cf_onboarding_referral_step";
export const BACK_FROM_REFERRAL_KEY = "cf_onboarding_back_from_referral";

export function setOnboardingFlowActive(): void {
  try {
    sessionStorage.setItem(ONBOARDING_FLOW_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearOnboardingFlow(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_FLOW_KEY);
    sessionStorage.removeItem(REFERRAL_STEP_KEY);
    sessionStorage.removeItem(BACK_FROM_REFERRAL_KEY);
  } catch {
    /* ignore */
  }
}

export function isOnboardingFlowActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ONBOARDING_FLOW_KEY) === "1";
  } catch {
    return false;
  }
}

/** One-time flag set when leaving referral to edit city (consumed on step-2c mount). */
export function consumeBackFromReferralFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const allow = sessionStorage.getItem(BACK_FROM_REFERRAL_KEY) === "1";
    if (allow) sessionStorage.removeItem(BACK_FROM_REFERRAL_KEY);
    return allow;
  } catch {
    return false;
  }
}

export function canStayOnOnboardingStep(
  onboardingCompleted: boolean | undefined,
  options?: {
    fromReferralQuery?: boolean;
    allowFromReferralBack?: boolean;
  }
): boolean {
  if (!onboardingCompleted) return true;
  if (isOnboardingFlowActive()) return true;
  if (options?.fromReferralQuery) return true;
  if (options?.allowFromReferralBack) return true;
  return false;
}
