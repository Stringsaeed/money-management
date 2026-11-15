import { router } from "expo-router";

import type { StepHeaderLeading } from "@/ui/trove";

import { BUDGET_HOME_ROUTE } from "./payday-flow";

/** Leaves the payday flow for Budget home, closing every step above it. */
export const closePaydayFlow = () => router.dismissTo(BUDGET_HOME_ROUTE);

/** The first step closes the flow; later steps go back to the one before. */
export function stepLeading(first: boolean): {
  readonly leading: StepHeaderLeading;
  readonly onLeading: () => void;
} {
  return first
    ? { leading: "close", onLeading: closePaydayFlow }
    : { leading: "back", onLeading: () => router.back() };
}
