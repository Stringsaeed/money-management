import { z } from "zod";

export interface SoundPreferences {
  readonly enabled: boolean;
  /** Global multiplier for every cue, 0–1. */
  readonly volume: number;
}

export const DEFAULT_SOUND_PREFERENCES: SoundPreferences = { enabled: true, volume: 0.6 };

const storedPreferencesSchema = z.object({
  enabled: z.boolean(),
  volume: z.number().finite(),
});

export const clampVolume = (volume: number): number => Math.min(1, Math.max(0, volume));

/** Stored preferences come from device storage; anything unreadable falls back to the defaults. */
export function parseSoundPreferences(raw: string | null): SoundPreferences {
  if (!raw) return DEFAULT_SOUND_PREFERENCES;
  try {
    const parsed = storedPreferencesSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return DEFAULT_SOUND_PREFERENCES;
    return { enabled: parsed.data.enabled, volume: clampVolume(parsed.data.volume) };
  } catch {
    return DEFAULT_SOUND_PREFERENCES;
  }
}

export const serializeSoundPreferences = (preferences: SoundPreferences): string =>
  JSON.stringify(preferences);
