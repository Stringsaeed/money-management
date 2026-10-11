import { useSyncExternalStore } from "react";

import { getBudgetingFlagState, subscribeBudgetingFlag } from "./budgeting-flag-store";

/** Whether Budgeting v1 is on: the PostHog "budgeting" flag, off until PostHog says true. */
export const useBudgetingEnabled = () =>
  useSyncExternalStore(subscribeBudgetingFlag, getBudgetingFlagState) === "on";

/** True once the flag is known to be off; false while on or still loading the cached answer. */
export const useBudgetingOff = () =>
  useSyncExternalStore(subscribeBudgetingFlag, getBudgetingFlagState) === "off";
