/**
 * Illustrative entries for the "Beyond the budget" cards. Every feature named here exists in
 * mobile-next (ledger, accounts, recurring, market, smart categories, home overview, guest mode).
 */

import type { RegionTerms } from "./region";

export type EntryKind = "income" | "expense" | "transfer";

interface LedgerEntry {
  emoji: string;
  name: string;
  meta: string;
  amount: number;
  kind: EntryKind;
}

export const ledgerEntries: readonly LedgerEntry[] = [
  { emoji: "💼", name: "Salary", meta: "INCOME · MAIN ACCOUNT", amount: 12000, kind: "income" },
  { emoji: "🛒", name: "Weekly shop", meta: "GROCERIES · CASH", amount: -212.4, kind: "expense" },
  {
    emoji: "🔁",
    name: "To savings",
    meta: "TRANSFER · MAIN → SAVINGS",
    amount: 2000,
    kind: "transfer",
  },
  { emoji: "☕", name: "Flat white", meta: "DINING · CARD", amount: -18, kind: "expense" },
];

export const ledgerFilters = [
  { label: "This month", on: true },
  { label: "All accounts", on: false },
  { label: "🛒 Groceries", on: false },
] as const;

export const recurringRules = (region: RegionTerms) => [
  {
    mon: "OCT",
    day: "25",
    emoji: "💼",
    name: "Salary",
    rule: "EVERY MONTH",
    amount: 12000,
    next: true,
  },
  {
    mon: "NOV",
    day: "01",
    emoji: "🏠",
    name: region.rent.one,
    rule: "EVERY 3 MONTHS · 4 TIMES",
    amount: -15000,
    next: false,
  },
  {
    mon: "NOV",
    day: "03",
    emoji: "📺",
    name: "Streaming",
    rule: "EVERY MONTH",
    amount: -45,
    next: false,
  },
];

/** Tickers come from the app's fixed market list; the moves are illustrative. */
export const marketQuotes = [
  { ticker: "NVDA", name: "Nvidia", group: "STOCK", change: 2.1 },
  { ticker: "XAU", name: "Gold", group: "METAL", change: 0.6 },
  { ticker: "BTC", name: "Bitcoin", group: "CRYPTO", change: -1.4 },
  { ticker: "ETH", name: "Ether", group: "CRYPTO", change: 0.9 },
] as const;

/** Income vs spending, six months, as on the Home card. */
export const overviewBars = [
  { income: 12000, spend: 8400 },
  { income: 12000, spend: 9100 },
  { income: 12500, spend: 7600 },
  { income: 12000, spend: 10200 },
  { income: 13200, spend: 8800 },
  { income: 12000, spend: 4286 },
] as const;
