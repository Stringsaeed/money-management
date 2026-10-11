import { z } from "zod";

/** Reminder choices that stay on this device: per-bill mutes, 1-day snoozes, and the opt-in prompt. */
export interface ReminderPrefs {
  readonly mutedRuleIds: readonly string[];
  /** `ruleId|scheduledDate` -> the Ledger Date the bill comes back on. */
  readonly snoozes: Readonly<Record<string, string>>;
  /** The person said "Not now" to the notification explanation. */
  readonly promptDismissed: boolean;
  /** The Ledger Date the person said "Not yet" to Got paid; the reminder comes back the next day. */
  readonly paydaySnoozedOn: string | null;
}

export const EMPTY_REMINDER_PREFS: ReminderPrefs = {
  mutedRuleIds: [],
  snoozes: {},
  promptDismissed: false,
  paydaySnoozedOn: null,
};

const prefsSchema = z.object({
  mutedRuleIds: z.array(z.string()).catch([]),
  snoozes: z.record(z.string(), z.string()).catch({}),
  promptDismissed: z.boolean().catch(false),
  paydaySnoozedOn: z.string().nullable().catch(null),
});

export function parseReminderPrefs(raw: string | null): ReminderPrefs {
  if (!raw) return EMPTY_REMINDER_PREFS;
  try {
    const parsed = prefsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_REMINDER_PREFS;
  } catch {
    return EMPTY_REMINDER_PREFS;
  }
}

export const serializeReminderPrefs = (prefs: ReminderPrefs): string => JSON.stringify(prefs);

export function setMuted(prefs: ReminderPrefs, ruleId: string, muted: boolean): ReminderPrefs {
  const others = prefs.mutedRuleIds.filter((id) => id !== ruleId);
  return { ...prefs, mutedRuleIds: muted ? [...others, ruleId] : others };
}

export const snoozeKey = (ruleId: string, scheduledDate: string): string =>
  `${ruleId}|${scheduledDate}`;

export function snoozeUntil(
  prefs: ReminderPrefs,
  ruleId: string,
  scheduledDate: string,
  until: string,
): ReminderPrefs {
  return { ...prefs, snoozes: { ...prefs.snoozes, [snoozeKey(ruleId, scheduledDate)]: until } };
}

/** The date a snoozed bill returns on, or null when it is not snoozed. */
export function snoozedUntil(
  prefs: ReminderPrefs,
  ruleId: string,
  scheduledDate: string,
): string | null {
  return prefs.snoozes[snoozeKey(ruleId, scheduledDate)] ?? null;
}

/** Drops snoozes that have already ended so the stored list stays small. */
export function pruneSnoozes(prefs: ReminderPrefs, today: string): ReminderPrefs {
  const live = Object.entries(prefs.snoozes).filter(([, until]) => until > today);
  return live.length === Object.keys(prefs.snoozes).length
    ? prefs
    : { ...prefs, snoozes: Object.fromEntries(live) };
}

/** "Not yet" on Got paid: remember today so tomorrow's reminder is scheduled (once a day at most). */
export const snoozePayday = (prefs: ReminderPrefs, today: string): ReminderPrefs =>
  prefs.paydaySnoozedOn === today ? prefs : { ...prefs, paydaySnoozedOn: today };
