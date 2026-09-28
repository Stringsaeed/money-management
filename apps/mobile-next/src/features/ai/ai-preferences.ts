import { z } from "zod";

export interface AiPreferences {
  /** Let the server pick a category from a new transaction's note. */
  readonly autoCategorize: boolean;
}

export const DEFAULT_AI_PREFERENCES: AiPreferences = { autoCategorize: true };

const storedPreferencesSchema = z.object({ autoCategorize: z.boolean() });

/** Stored preferences come from device storage; anything unreadable falls back to the defaults. */
export function parseAiPreferences(raw: string | null): AiPreferences {
  if (!raw) return DEFAULT_AI_PREFERENCES;
  try {
    const parsed = storedPreferencesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_AI_PREFERENCES;
  } catch {
    return DEFAULT_AI_PREFERENCES;
  }
}

export const serializeAiPreferences = (preferences: AiPreferences): string =>
  JSON.stringify(preferences);
