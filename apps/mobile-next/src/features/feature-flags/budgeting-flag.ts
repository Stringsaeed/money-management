export type BudgetingFlagState = "on" | "off" | "unsettled";

export interface BudgetingFlagInputs {
  /** False with no PostHog client (no API key): budgeting stays off. */
  readonly hasClient: boolean;
  /** PostHog's answer this session; undefined until flags have loaded. */
  readonly live: boolean | undefined;
  /** The last answer saved on the device; undefined when none or not read yet. */
  readonly cached: boolean | undefined;
  /** The saved answer has been read (or failed to read). */
  readonly cacheRead: boolean;
}

/**
 * Budgeting fails closed: on only when PostHog said so, this session or the last time it
 * answered. "unsettled" is off for display, but not yet a reason to cancel anything.
 */
export function resolveBudgetingFlag(inputs: BudgetingFlagInputs): BudgetingFlagState {
  if (!inputs.hasClient) return "off";
  const known = inputs.live ?? inputs.cached;
  if (known !== undefined) return known ? "on" : "off";
  return inputs.cacheRead ? "off" : "unsettled";
}

export const parseCachedBudgeting = (raw: string | null): boolean | undefined =>
  raw === "on" ? true : raw === "off" ? false : undefined;
