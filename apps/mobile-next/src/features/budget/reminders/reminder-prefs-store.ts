import * as SecureStore from "expo-secure-store";

import { parseReminderPrefs, serializeReminderPrefs, type ReminderPrefs } from "./reminder-prefs";

const entries = new Map<string, ReminderPrefs>();
const loads = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

/** SecureStore keys allow letters, digits, ".", "-" and "_". */
export const prefsStorageKey = (scopeId: string): string =>
  `trove-next.budget-reminders.${scopeId.replace(/[^A-Za-z0-9._-]/g, "_")}`;

export const subscribeReminderPrefs = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** `undefined` while the stored prefs are still loading. */
export const getReminderPrefs = (storageKey: string): ReminderPrefs | undefined =>
  entries.get(storageKey);

export function loadReminderPrefs(storageKey: string): Promise<void> {
  const pending = loads.get(storageKey);
  if (pending) return pending;
  const load = SecureStore.getItemAsync(storageKey)
    .catch(() => null)
    .then((raw) => {
      if (!entries.has(storageKey)) {
        entries.set(storageKey, parseReminderPrefs(raw));
        notify();
      }
    });
  loads.set(storageKey, load);
  return load;
}

/** Applies a change after the stored prefs have loaded, so older choices are never overwritten. */
export async function updateReminderPrefs(
  storageKey: string,
  change: (prefs: ReminderPrefs) => ReminderPrefs,
) {
  await loadReminderPrefs(storageKey);
  const current = entries.get(storageKey);
  if (!current) return;
  const next = change(current);
  if (next === current) return;
  entries.set(storageKey, next);
  notify();
  SecureStore.setItemAsync(storageKey, serializeReminderPrefs(next)).catch((cause: unknown) =>
    console.warn("Budget reminders could not save your choices.", cause),
  );
}
