import { formatAmount, withCode } from "@/lib/currency";
import type { Currency } from "@/lib/currency";

export type QuickAddImpact = "over" | "fits";

export interface QuickAddKind {
  emoji: string;
  label: string;
  selected: boolean;
}

export interface QuickAddEnvelope {
  emoji: string;
  label: string;
  left: string;
  selected: boolean;
}

export interface QuickAddMeta {
  emoji: string;
  label: string;
  /** The note chip stretches to fill the row. */
  grow: boolean;
}

export interface QuickAddKey {
  label: string;
  backspace: boolean;
}

export interface QuickAddAmount {
  whole: string;
  cents: string;
  impact: string;
  impactIcon: string;
}

export const QUICK_ADD_KINDS: readonly QuickAddKind[] = [
  { emoji: "💸", label: "Spent", selected: true },
  { emoji: "↩️", label: "Money back", selected: false },
  { emoji: "💰", label: "Got paid", selected: false },
];

export const quickAddEnvelopes = (currency: Currency): readonly QuickAddEnvelope[] => [
  { emoji: "🍽️", label: "Dining", left: formatAmount(148, currency), selected: true },
  { emoji: "🛒", label: "Groceries", left: formatAmount(588, currency), selected: false },
  { emoji: "⛽", label: "Fuel", left: formatAmount(240, currency), selected: false },
  { emoji: "🎈", label: "Personal", left: formatAmount(282, currency), selected: false },
  { emoji: "🔎", label: "All", left: "", selected: false },
];

export const QUICK_ADD_META: readonly QuickAddMeta[] = [
  { emoji: "💵", label: "Cash", grow: false },
  { emoji: "📅", label: "Today", grow: false },
  { emoji: "📝", label: "Team dinner", grow: true },
];

export const QUICK_ADD_KEYS: readonly QuickAddKey[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  "0",
  "Delete",
].map((label) => ({ label, backspace: label === "Delete" }));

/** Minor-unit tail of a whole amount: `.00`, `.000`, or none for JPY. */
const tail = (currency: Currency) => (currency.digits > 0 ? `.${"0".repeat(currency.digits)}` : "");

export function quickAddAmount(impact: QuickAddImpact, currency: Currency): QuickAddAmount {
  if (impact === "over") {
    return {
      whole: formatAmount(323, currency),
      cents: tail(currency),
      impact: `Dining & coffee will be ${withCode(175, currency)} over`,
      impactIcon: "⚠︎",
    };
  }
  return {
    whole: formatAmount(85, currency),
    cents: tail(currency),
    impact: `Dining & coffee: ${withCode(63, currency)} left after this`,
    impactIcon: "✓",
  };
}
