import * as SecureStore from "expo-secure-store";
import { setEnabled, setVolume } from "cuelume-native";

import {
  clampVolume,
  DEFAULT_SOUND_PREFERENCES,
  parseSoundPreferences,
  serializeSoundPreferences,
  type SoundPreferences,
} from "./sound-preferences";

const STORAGE_KEY = "trove-next.sound-preferences";
const PERSIST_DELAY_MS = 300;

let preferences = DEFAULT_SOUND_PREFERENCES;
let changedBeforeHydration = false;
let persistTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const applyToEngine = (next: SoundPreferences) => {
  setEnabled(next.enabled);
  setVolume(next.volume);
};

const commit = (next: SoundPreferences) => {
  preferences = next;
  applyToEngine(next);
  for (const listener of listeners) listener();
};

const schedulePersist = () => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    SecureStore.setItemAsync(STORAGE_KEY, serializeSoundPreferences(preferences)).catch(
      (cause: unknown) =>
        console.warn("Sound preferences were not saved; they reset on next launch.", cause),
    );
  }, PERSIST_DELAY_MS);
};

applyToEngine(preferences);

export const getSoundPreferences = () => preferences;

export const subscribeSoundPreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function updateSoundPreferences(patch: Partial<SoundPreferences>) {
  changedBeforeHydration = true;
  const next = { ...preferences, ...patch };
  commit({ enabled: next.enabled, volume: clampVolume(next.volume) });
  schedulePersist();
}

/** Loads saved preferences once at startup; a change made while loading wins over storage. */
export async function hydrateSoundPreferences() {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
  if (!changedBeforeHydration) commit(parseSoundPreferences(raw));
}
