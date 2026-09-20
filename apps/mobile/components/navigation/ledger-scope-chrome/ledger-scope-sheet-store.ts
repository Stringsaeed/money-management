import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function openLedgerScopeSheet() {
  if (open) return;
  open = true;
  emit();
}

export function closeLedgerScopeSheet() {
  if (!open) return;
  open = false;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return open;
}

export function useLedgerScopeSheetOpen() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
