import type { SetupStep } from "./setup-types";

/** Where each setup step lives, so "Continue setup" can reopen the furthest step reached. */
export const SETUP_STEP_ROUTES = {
  payday: "/budget/setup/payday",
  items: "/budget/setup/items",
  amounts: "/budget/setup/amounts",
  review: "/budget/setup/review",
} as const satisfies Record<SetupStep, string>;
