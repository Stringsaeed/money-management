import type { Href } from "expo-router";

import type { SetupStep } from "./setup-types";

/** The route of a setup step. An additional budget's setup carries its currency in the route. */
export const setupHref = (step: SetupStep, currency: string | null): Href =>
  currency === null
    ? SETUP_STEP_ROUTES[step]
    : { pathname: SETUP_STEP_ROUTES[step], params: { currency } };

/** Where each setup step lives, so "Continue setup" can reopen the furthest step reached. */
export const SETUP_STEP_ROUTES = {
  payday: "/budget/setup/payday",
  items: "/budget/setup/items",
  amounts: "/budget/setup/amounts",
  review: "/budget/setup/review",
} as const satisfies Record<SetupStep, string>;
