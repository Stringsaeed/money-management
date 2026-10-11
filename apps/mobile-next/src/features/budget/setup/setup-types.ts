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
