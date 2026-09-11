import { personalLedgerId } from "@trove/protocol";

/** Ledger target for a one-time local-to-cloud import (#98 / #229). */
export type ImportLedgerBinding =
  | { readonly kind: "household"; readonly householdId: string; readonly ledgerId: string }
  | { readonly kind: "personal"; readonly ledgerId: string };

export function householdImportBinding(householdId: string): ImportLedgerBinding {
  return { kind: "household", householdId, ledgerId: householdId };
}

export function personalImportBinding(userId: string): ImportLedgerBinding {
  return { kind: "personal", ledgerId: personalLedgerId(userId) };
}
