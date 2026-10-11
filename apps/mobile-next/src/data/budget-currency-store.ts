import * as SecureStore from "expo-secure-store";

import {
  parseBudgetCurrencyState,
  serializeBudgetCurrencyState,
  type BudgetCurrencyState,
} from "./budget-currency";

const entries = new Map<string, BudgetCurrencyState>();
const loads = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

/** SecureStore keys allow letters, digits, ".", "-" and "_". */
export const budgetCurrencyStorageKey = (scopeId: string): string =>
  `trove-next.budget-currency.${scopeId.replace(/[^A-Za-z0-9._-]/g, "_")}`;

export const subscribeBudgetCurrency = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** `undefined` while the stored choice is still loading. */
export const getBudgetCurrencyState = (storageKey: string): BudgetCurrencyState | undefined =>
  entries.get(storageKey);

export function loadBudgetCurrencyState(storageKey: string): Promise<void> {
  const pending = loads.get(storageKey);
  if (pending) return pending;
  const load = SecureStore.getItemAsync(storageKey)
    .catch(() => null)
    .then((raw) => {
      if (!entries.has(storageKey)) {
        entries.set(storageKey, parseBudgetCurrencyState(raw));
        notify();
      }
    });
  loads.set(storageKey, load);
  return load;
}

/** Applies a change after the stored choice has loaded, so an older choice is never overwritten. */
export async function updateBudgetCurrencyState(
  storageKey: string,
  change: (state: BudgetCurrencyState) => BudgetCurrencyState,
) {
  await loadBudgetCurrencyState(storageKey);
  const current = entries.get(storageKey);
  if (!current) return;
  const next = change(current);
  if (next === current) return;
  entries.set(storageKey, next);
  notify();
  SecureStore.setItemAsync(storageKey, serializeBudgetCurrencyState(next)).catch((cause: unknown) =>
    console.warn("Your budget currency choice was not saved.", cause),
  );
}
