import { useEffect, useSyncExternalStore } from "react";

import { scopeKey } from "@/data/ledger-collections";
import { useLedgerData } from "@/data/ledger-queries";

import {
  EMPTY_REMINDER_PREFS,
  pruneSnoozes,
  setMuted,
  snoozePayday,
  snoozeUntil,
  type ReminderPrefs,
} from "./reminder-prefs";
import {
  getReminderPrefs,
  loadReminderPrefs,
  prefsStorageKey,
  subscribeReminderPrefs,
  updateReminderPrefs,
} from "./reminder-prefs-store";

export interface UseReminderPrefs {
  readonly prefs: ReminderPrefs;
  /** False until the stored choices have loaded; nothing should be scheduled before then. */
  readonly ready: boolean;
  readonly setMuted: (ruleId: string, muted: boolean) => Promise<void>;
  readonly snooze: (ruleId: string, scheduledDate: string, until: string) => Promise<void>;
  readonly forgetEndedSnoozes: (today: string) => Promise<void>;
  readonly dismissPrompt: () => Promise<void>;
  /** "Not yet" on Got paid: remind again tomorrow. */
  readonly snoozePayday: (today: string) => Promise<void>;
}

/** Per-bill mutes, snoozes and the notification prompt choice for this identity and ledger. */
export function useReminderPrefs(): UseReminderPrefs {
  const { identityKey, scope } = useLedgerData();
  const storageKey = prefsStorageKey(scopeKey(identityKey, scope));
  const stored = useSyncExternalStore(subscribeReminderPrefs, () => getReminderPrefs(storageKey));
  useEffect(() => {
    void loadReminderPrefs(storageKey);
  }, [storageKey]);

  return {
    prefs: stored ?? EMPTY_REMINDER_PREFS,
    ready: stored !== undefined,
    setMuted: (ruleId, muted) =>
      updateReminderPrefs(storageKey, (prefs) => setMuted(prefs, ruleId, muted)),
    snooze: (ruleId, scheduledDate, until) =>
      updateReminderPrefs(storageKey, (prefs) => snoozeUntil(prefs, ruleId, scheduledDate, until)),
    forgetEndedSnoozes: (today) =>
      updateReminderPrefs(storageKey, (prefs) => pruneSnoozes(prefs, today)),
    dismissPrompt: () =>
      updateReminderPrefs(storageKey, (prefs) => ({ ...prefs, promptDismissed: true })),
    snoozePayday: (today) =>
      updateReminderPrefs(storageKey, (prefs) => snoozePayday(prefs, today)),
  };
}
