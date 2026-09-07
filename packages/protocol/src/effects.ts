/**
 * Effect tag vocabulary shared by command results and household activity.
 *
 * A committed command appends one `HouseholdChange` carrying the subset of
 * tags it invalidated. Clients map tags onto their local cache invalidation
 * matrix; the API maps them onto projection recomputation.
 */

/** What a committed command changed, at cache-invalidation granularity. */
export const EFFECT_TAGS = [
  "rules",
  "upcoming",
  "ledger",
  "balances",
  "summaries",
  "envelopes",
  "assignments",
  "projections",
  "members",
] as const;

export type EffectTag = (typeof EFFECT_TAGS)[number];

export type Effects = readonly EffectTag[];

/** True when every tag in `subset` is covered by `effects`. */
export const coversEffects = (effects: Effects, subset: Effects): boolean =>
  subset.every((tag) => effects.includes(tag));

/** One row appended to `household_changes` per committed command. */
export interface HouseholdChange {
  /** Per-household monotonic sequence number used for ordered activity. */
  readonly seq: number;
  readonly householdId: string;
  /** Idempotency key of the command that produced this change. */
  readonly commandId: string;
  /** Authenticated user the command was attributed to. */
  readonly userId: string;
  readonly createdAt: string;
  readonly effects: Effects;
}
