import * as SecureStore from "expo-secure-store";

import type { LedgerSelection } from "./types";

function selectionKey(userId: string): string {
  return `trove.ledger-selection.${userId}`;
}

export function encodeLedgerSelection(selection: LedgerSelection): string {
  return selection.kind === "personal" ? "personal" : `household:${selection.householdId}`;
}

export function decodeLedgerSelection(raw: string | null): LedgerSelection {
  if (!raw || raw === "personal") return { kind: "personal" };
  if (raw.startsWith("household:")) {
    const householdId = raw.slice("household:".length).trim();
    if (householdId) return { kind: "household", householdId };
  }
  return { kind: "personal" };
}

export async function readLedgerSelection(userId: string): Promise<LedgerSelection> {
  try {
    return decodeLedgerSelection(await SecureStore.getItemAsync(selectionKey(userId)));
  } catch {
    return { kind: "personal" };
  }
}

export async function writeLedgerSelection(
  userId: string,
  selection: LedgerSelection,
): Promise<void> {
  await SecureStore.setItemAsync(selectionKey(userId), encodeLedgerSelection(selection));
}

export async function clearLedgerSelection(userId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(selectionKey(userId));
  } catch {
    // Best-effort: a missing key is already Personal.
  }
}
