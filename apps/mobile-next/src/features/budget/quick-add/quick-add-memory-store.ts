import * as SecureStore from "expo-secure-store";

import {
  parseQuickAddMemory,
  rememberSpend,
  serializeQuickAddMemory,
  type QuickAddMemory,
} from "./quick-add-memory";

/** `undefined` while the stored memory is still loading. */
const entries = new Map<string, QuickAddMemory>();
const loads = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

/** SecureStore keys allow letters, digits, ".", "-" and "_". */
export const memoryStorageKey = (scopeId: string): string =>
  `trove-next.quick-add.${scopeId.replace(/[^A-Za-z0-9._-]/g, "_")}`;

export const subscribeQuickAddMemory = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getQuickAddMemory = (storageKey: string): QuickAddMemory | undefined =>
  entries.get(storageKey);

/** Reads the stored memory once per key. */
export function loadQuickAddMemory(storageKey: string): Promise<void> {
  const pending = loads.get(storageKey);
  if (pending) return pending;
  const load = SecureStore.getItemAsync(storageKey)
    .catch(() => null)
    .then((raw) => {
      if (!entries.has(storageKey)) {
        entries.set(storageKey, parseQuickAddMemory(raw));
        for (const listener of listeners) listener();
      }
    });
  loads.set(storageKey, load);
  return load;
}

/** Records a saved spend. Waits for the stored memory first so it never overwrites older history. */
export async function rememberQuickAddSpend(
  storageKey: string,
  spend: { readonly accountId: string; readonly envelopeId: string },
) {
  await loadQuickAddMemory(storageKey);
  const current = entries.get(storageKey);
  if (!current) return;
  const next = rememberSpend(current, spend);
  entries.set(storageKey, next);
  for (const listener of listeners) listener();
  SecureStore.setItemAsync(storageKey, serializeQuickAddMemory(next)).catch((cause: unknown) =>
    console.warn("Quick add could not save your last account and envelopes.", cause),
  );
}
