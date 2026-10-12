import type { V2EnvelopeGroup, V2PaydayRule } from "@trove/api/v2/contracts";

export type SetupStep = "payday" | "items" | "amounts" | "review";

export interface CustomItem {
  readonly name: string;
  readonly group: V2EnvelopeGroup;
}

/**
 * What the person has chosen so far. Money is kept as the text they typed so a partial entry
 * such as "12." survives; maps hold only explicit choices, everything else falls back to the
 * defaults derived from the ledger.
 */
export interface SetupDraft {
  readonly step: SetupStep;
  /** The first budget's currency when the person picked one; `null` keeps the suggested default. */
  readonly currency: string | null;
  readonly payday: V2PaydayRule | null;
  readonly usualSalary: string;
  readonly paydayReminder: boolean;
  readonly openingCash: string;
  /** Account id -> ticked, when the person changed it. */
  readonly funding: Readonly<Record<string, boolean>>;
  /** Item key -> ticked, when the person changed it. */
  readonly selection: Readonly<Record<string, boolean>>;
  readonly custom: readonly CustomItem[];
  /** Item key -> typed monthly amount. */
  readonly amounts: Readonly<Record<string, string>>;
  /** Household only, informational: member user id -> typed expected monthly share. */
  readonly householdShares: Readonly<Record<string, string>>;
}

export const GROUP_ORDER = [
  "bills",
  "everyday",
  "saving",
] as const satisfies readonly V2EnvelopeGroup[];

export const GROUP_LABELS = {
  bills: "Bills",
  everyday: "Everyday",
  saving: "Saving for",
} as const satisfies Record<V2EnvelopeGroup, string>;

/** What each group is, under its stamp on What it's for. */
export const GROUP_HINTS = {
  bills: "Same amount, same day, every month.",
  everyday: "What you spend as you go. This is your Safe to spend.",
  saving: "Big payments, set aside a little every payday.",
} as const satisfies Record<V2EnvelopeGroup, string>;

/** The dashed add chip closing each group. */
export const GROUP_ADD_LABELS = {
  bills: "Add a bill",
  everyday: "Add your own",
  saving: "Add a big payment",
} as const satisfies Record<V2EnvelopeGroup, string>;

/** Placeholder of the name field an add chip opens. */
export const GROUP_ADD_PLACEHOLDERS = {
  bills: "Netflix, internet, insurance",
  everyday: "Gym, pets, gifts",
  saving: "Car service, flights home",
} as const satisfies Record<V2EnvelopeGroup, string>;

/** Leading emoji of each group's line on the review receipt. */
export const GROUP_RECEIPT_EMOJI = {
  bills: "🧾",
  everyday: "🛒",
  saving: "🏠",
} as const satisfies Record<V2EnvelopeGroup, string>;
