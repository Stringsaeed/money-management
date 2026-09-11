import { Redirect } from "expo-router";

import { ONBOARDING_ENABLED } from "@/constants/onboarding";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default function OnboardingScreen() {
  if (!ONBOARDING_ENABLED) return <Redirect href="/" />;
  return <OnboardingFlow />;
}
