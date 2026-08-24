import { z } from "zod";

import { EFFECT_TAGS, type EffectTag, type Effects } from "@trove/protocol";

/**
 * Wire contract of a push notification: `{seq, effects}` — notification only,
 * never row data (#93). Unknown effect tags are dropped rather than rejected so
 * an older consumer tolerates a newer server vocabulary.
 */
export const changeNotificationSchema = z.object({
  seq: z.number().int().nonnegative(),
  effects: z.array(z.string()),
});

export interface ParsedChangeNotification {
  readonly seq: number;
  readonly effects: Effects;
}

const isEffectTag = (effect: string): effect is EffectTag =>
  EFFECT_TAGS.includes(effect as EffectTag);

export function parseChangeNotification(input: unknown): ParsedChangeNotification | null {
  const parsed = changeNotificationSchema.safeParse(input);
  return parsed.success
    ? { seq: parsed.data.seq, effects: parsed.data.effects.filter(isEffectTag) }
    : null;
}
