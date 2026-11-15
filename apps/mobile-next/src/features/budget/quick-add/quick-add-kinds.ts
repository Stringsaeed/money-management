import type { KindOption } from "@/ui/trove";

/** "Money back" (a Refund) has no API yet, so Quick add offers spending and the Got paid flow. */
export type QuickAddKind = "spent" | "got_paid";

export const QUICK_ADD_KINDS: readonly KindOption<QuickAddKind>[] = [
  { value: "spent", label: "Spent", emoji: "💸" },
  { value: "got_paid", label: "Got paid", emoji: "💰" },
];
