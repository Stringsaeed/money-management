import PostHog from "posthog-react-native";
import * as SecureStore from "expo-secure-store";

import { createAnalytics, type AnalyticsClient } from "./analytics";

const STORAGE_KEY = "trove-next.analytics-sharing";
const PERSIST_FAILED = "Analytics preference was not saved; it resets on next launch.";
const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

const createClient = (): AnalyticsClient | null => {
  if (!API_KEY) return null;
  try {
    return new PostHog(API_KEY, { host: HOST, captureAppLifecycleEvents: false });
  } catch {
    return null;
  }
};

let sharing = true;
let changedBeforeHydration = false;
const analytics = createAnalytics(createClient(), sharing);
const listeners = new Set<() => void>();

const commit = (next: boolean) => {
  sharing = next;
  analytics.setSharing(next);
  for (const listener of listeners) listener();
};

export const track = analytics.track;

export const getAnalyticsSharing = () => sharing;

export const subscribeAnalyticsSharing = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function setAnalyticsSharing(next: boolean) {
  changedBeforeHydration = true;
  commit(next);
  SecureStore.setItemAsync(STORAGE_KEY, next ? "on" : "off").catch((cause: unknown) =>
    console.warn(PERSIST_FAILED, cause),
  );
}

/** Loads the saved choice once at startup; a change made while loading wins over storage. */
export async function hydrateAnalyticsSharing() {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
  if (!changedBeforeHydration) commit(raw !== "off");
}
