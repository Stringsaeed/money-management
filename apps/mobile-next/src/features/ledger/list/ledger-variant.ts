/**
 * Candidate Ledger layouts under review. All share the same data, filter sheet, and
 * removable filter chips; they differ in hierarchy and density. Delete the losers once
 * one is chosen.
 */
export type LedgerVariant = "journal" | "summary" | "accounts" | "statement" | "monthly";

export const LEDGER_VARIANTS: readonly {
  readonly id: LedgerVariant;
  readonly label: string;
}[] = [
  { id: "journal", label: "A · Journal" },
  { id: "summary", label: "B · Summary" },
  { id: "accounts", label: "C · Accounts" },
  { id: "statement", label: "D · Statement" },
  { id: "monthly", label: "E · Monthly" },
];
