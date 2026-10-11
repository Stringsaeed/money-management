import PostHog from "posthog-react-native";
import * as SecureStore from "expo-secure-store";

import { createAnalytics } from "./analytics";

const STORAGE_KEY = "trove-next.analytics-sharing";
const PERSIST_FAILED = "Analytics preference was not saved; it resets on next launch.";
const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

const createClient = (): PostHog | null => {
  if (!API_KEY) return null;
  try {
    // sendFeatureFlagEvent: false keeps reading a flag from ever capturing $feature_flag_called.
    return new PostHog(API_KEY, {
      host: HOST,
      captureAppLifecycleEvents: false,
      sendFeatureFlagEvent: false,
    });
  } catch {
    return null;
  }
};

// Off until the saved choice has been read: an event fired before SecureStore answers must not
// be sent for someone who opted out, and optIn() must not re-open a stored opt-out.
let sharing = false;
let changedBeforeHydration = false;
const client = createClient();
const analytics = createAnalytics(client, sharing);
const listeners = new Set<() => void>();

const commit = (next: boolean) => {
  sharing = next;
  analytics.setSharing(next);
  for (const listener of listeners) listener();
};

export const track = analytics.track;

/** What a feature flag needs from the PostHog client; null with no client (no API key). */
export interface FeatureFlagSource {
  /** The boolean value of a flag: undefined until flags have loaded. Never captures an event. */
  readonly read: (key: string) => boolean | undefined;
  readonly subscribe: (listener: () => void) => () => void;
  readonly reload: () => void;
}

/**
 * Flags are fetched whether or not "Share anonymous usage" is on: the SDK's opt-out only drops
 * captured events (`enqueue`), never the flags request. Reading goes through `getFeatureFlags()`,
 * which does not capture, and the client is built with `sendFeatureFlagEvent: false` anyway.
 */
export const featureFlagSource: FeatureFlagSource | null = client && {
  read: (key) => {
    const flags = client.getFeatureFlags();
    return flags ? flags[key] === true : undefined;
  },
  subscribe: (listener) => client.onFeatureFlags(() => listener()),
  reload: () => client.reloadFeatureFlags(),
};

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
