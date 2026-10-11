import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

import { featureFlagSource } from "@/features/analytics";

import {
  devBudgetingOverride,
  parseCachedBudgeting,
  resolveBudgetingFlag,
  type BudgetingFlagState,
} from "./budgeting-flag";

/** The PostHog flag (boolean) that turns Budgeting v1 on. */
const FLAG_KEY = "budgeting";
const STORAGE_KEY = "trove-next.budgeting-flag";

let live: boolean | undefined;
let cached: boolean | undefined;
let cacheRead = false;
let started = false;
const listeners = new Set<() => void>();

/** Dev builds can force Budgeting on with `EXPO_PUBLIC_DEV_BUDGETING=on`, e.g. against a local API. */
const devForcedOn = devBudgetingOverride(__DEV__, process.env.EXPO_PUBLIC_DEV_BUDGETING);

const compute = (): BudgetingFlagState =>
  devForcedOn
    ? "on"
    : resolveBudgetingFlag({ hasClient: featureFlagSource !== null, live, cached, cacheRead });
let state: BudgetingFlagState = compute();

const refresh = () => {
  const next = compute();
  if (next === state) return;
  state = next;
  for (const listener of listeners) listener();
};

const readLive = () => {
  const value = featureFlagSource?.read(FLAG_KEY);
  if (value === undefined) return;
  live = value;
  if (cached !== value) {
    cached = value;
    SecureStore.setItemAsync(STORAGE_KEY, value ? "on" : "off").catch((cause: unknown) =>
      console.warn("The budgeting flag was not cached; it is re-read on next launch.", cause),
    );
  }
  refresh();
};

export const getBudgetingFlagState = () => state;

export const getBudgetingEnabled = () => state === "on";

export const subscribeBudgetingFlag = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Reads the cached answer, follows PostHog's flag updates, and reloads flags whenever the app
 * returns to the foreground (the SDK loads them once at start). Safe to call more than once.
 */
export function startBudgetingFlag() {
  if (started) return;
  started = true;
  SecureStore.getItemAsync(STORAGE_KEY)
    .catch(() => null)
    .then((raw) => {
      cached ??= parseCachedBudgeting(raw);
      cacheRead = true;
      refresh();
    });
  if (!featureFlagSource) return;
  featureFlagSource.subscribe(readLive);
  readLive();
  AppState.addEventListener("change", (appState) => {
    if (appState === "active") featureFlagSource?.reload();
  });
}
