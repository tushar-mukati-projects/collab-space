import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tracks onboarding state only — auth is handled by Clerk.
interface OnboardingState {
  hasCompletedOnboarding: boolean;
  workspaceName: string | null;
  completeOnboarding: (workspaceName: string) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      workspaceName: null,

      completeOnboarding: (workspaceName: string) => {
        set({ hasCompletedOnboarding: true, workspaceName });
      },

      resetOnboarding: () => {
        set({ hasCompletedOnboarding: false, workspaceName: null });
      },
    }),
    { name: "collab-onboarding" },
  ),
);
