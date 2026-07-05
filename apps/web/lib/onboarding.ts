const ONBOARDING_COMPLETE_KEY = "nexa_onboarding_complete";

export function markOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ONBOARDING_COMPLETE_KEY, "1");
}

export function hasPendingOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ONBOARDING_COMPLETE_KEY) === "1";
}

export function clearPendingOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}
