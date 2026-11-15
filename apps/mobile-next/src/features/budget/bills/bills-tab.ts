/** B1's two tabs: this period's bills, and the big payments over the next 12 months. */
export type BillsTab = "month" | "saving";

export const BILLS_TABS = [
  { value: "month", label: "This month" },
  { value: "saving", label: "Next 12 months" },
] as const satisfies readonly { value: BillsTab; label: string }[];

/** Board top padding (56) less the 47pt status bar it sits under. */
export const BILLS_TOP_GAP = 9;
