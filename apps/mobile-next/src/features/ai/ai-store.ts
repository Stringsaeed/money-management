import * as SecureStore from "expo-secure-store";

import {
  DEFAULT_AI_PREFERENCES,
  parseAiPreferences,
  serializeAiPreferences,
  type AiPreferences,
} from "./ai-preferences";

const STORAGE_KEY = "trove-next.ai-preferences";

let preferences = DEFAULT_AI_PREFERENCES;
let changedBeforeHydration = false;
const listeners = new Set<() => void>();

const commit = (next: AiPreferences) => {
  preferences = next;
  for (const listener of listeners) listener();
};

export const getAiPreferences = () => preferences;

export const subscribeAiPreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function updateAiPreferences(patch: Partial<AiPreferences>) {
  changedBeforeHydration = true;
  commit({ ...preferences, ...patch });
  SecureStore.setItemAsync(STORAGE_KEY, serializeAiPreferences(preferences)).catch(
    (cause: unknown) =>
      console.warn("AI preferences were not saved; they reset on next launch.", cause),
  );
}

/** Loads saved preferences once at startup; a change made while loading wins over storage. */
export async function hydrateAiPreferences() {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
  if (!changedBeforeHydration) commit(parseAiPreferences(raw));
}
