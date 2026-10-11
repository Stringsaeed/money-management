import * as SecureStore from "expo-secure-store";

import { parseSetupDraft, serializeSetupDraft } from "./setup-draft";
import type { SetupDraft } from "./setup-types";

const PERSIST_DELAY_MS = 300;

/** `undefined` while the stored draft is still loading, `null` when there is none. */
type Entry = SetupDraft | null | undefined;

const entries = new Map<string, Entry>();
const loads = new Map<string, Promise<void>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

/** SecureStore keys allow letters, digits, ".", "-" and "_". */
export const draftStorageKey = (scopeId: string): string =>
  `trove-next.budget-setup-draft.${scopeId.replace(/[^A-Za-z0-9._-]/g, "_")}`;

export const subscribeSetupDraft = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getSetupDraft = (storageKey: string): Entry => entries.get(storageKey);

/** Reads the stored draft once per key; a change made while loading wins over storage. */
export function loadSetupDraft(storageKey: string): Promise<void> {
  const pending = loads.get(storageKey);
  if (pending) return pending;
  const load = SecureStore.getItemAsync(storageKey)
    .catch(() => null)
    .then((raw) => {
      if (entries.get(storageKey) === undefined) {
        entries.set(storageKey, parseSetupDraft(raw));
        emit();
      }
    });
  loads.set(storageKey, load);
  return load;
}

const persist = (storageKey: string, draft: SetupDraft | null) => {
  const write = draft
    ? SecureStore.setItemAsync(storageKey, serializeSetupDraft(draft))
    : SecureStore.deleteItemAsync(storageKey);
  write.catch((cause: unknown) =>
    console.warn("The budget draft was not saved; it may be lost on relaunch.", cause),
  );
};

const clearTimer = (storageKey: string) => {
  const timer = timers.get(storageKey);
  if (timer) clearTimeout(timer);
  timers.delete(storageKey);
};

/** Replaces the draft and saves it shortly after the last change. */
export function setSetupDraft(storageKey: string, draft: SetupDraft) {
  entries.set(storageKey, draft);
  emit();
  clearTimer(storageKey);
  timers.set(
    storageKey,
    setTimeout(() => {
      timers.delete(storageKey);
      persist(storageKey, draft);
    }, PERSIST_DELAY_MS),
  );
}

/** Drops the draft now, in memory and in storage. */
export function clearSetupDraft(storageKey: string) {
  clearTimer(storageKey);
  entries.set(storageKey, null);
  emit();
  persist(storageKey, null);
}
