import { File, Paths } from "expo-file-system";
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

/**
 * Letters, digits, ".", "-" and "_": valid as a SecureStore key and as a file name. The first
 * budget's draft has no currency in its key (it picks one); each additional budget's is keyed
 * by the currency being set up, so two setups never share a draft.
 */
export const draftStorageKey = (scopeId: string, currency: string | null = null): string =>
  `trove-next.budget-setup-draft.${scopeId.replace(/[^A-Za-z0-9._-]/g, "_")}${
    currency === null ? "" : `.${currency.replace(/[^A-Za-z0-9._-]/g, "_")}`
  }`;

/**
 * The draft lives in a file in the app's document directory. It used to be in SecureStore, which
 * documents a ~2 KB limit per value: a plan with 25+ envelopes did not fit and silently failed.
 */
const draftFile = (storageKey: string) => new File(Paths.document, `${storageKey}.json`);

/** The stored draft text, or null. A draft left in SecureStore by an older build moves over once. */
async function readStored(storageKey: string): Promise<string | null> {
  const file = draftFile(storageKey);
  if (file.exists) return file.text();
  const legacy = await SecureStore.getItemAsync(storageKey);
  if (legacy === null) return null;
  writeStored(storageKey, legacy);
  await SecureStore.deleteItemAsync(storageKey).catch(() => undefined);
  return legacy;
}

function writeStored(storageKey: string, raw: string) {
  const file = draftFile(storageKey);
  if (!file.exists) file.create();
  file.write(raw);
}

function removeStored(storageKey: string) {
  const file = draftFile(storageKey);
  if (file.exists) file.delete();
  // A draft an older build left behind must not come back after Clear.
  SecureStore.deleteItemAsync(storageKey).catch(() => undefined);
}

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
  const load = readStored(storageKey)
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
  try {
    if (draft) writeStored(storageKey, serializeSetupDraft(draft));
    else removeStored(storageKey);
  } catch (cause) {
    console.warn("The budget draft was not saved; it may be lost on relaunch.", cause);
  }
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
