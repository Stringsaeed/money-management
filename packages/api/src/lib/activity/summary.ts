import type { EffectTag } from "@trove/protocol";

/**
 * Effect tags are cache-invalidation vocabulary, not user-facing copy. This
 * map is the single place that decodes a tag into the affected-entity noun
 * shown on the activity timeline.
 */
const EFFECT_LABELS: Readonly<Record<EffectTag, string>> = {
  rules: "recurring rules",
  upcoming: "upcoming occurrences",
  ledger: "the ledger",
  balances: "account balances",
  summaries: "category summaries",
  envelopes: "budget envelopes",
  assignments: "transaction assignments",
  projections: "spending projections",
  members: "household members",
};

/** Human-readable noun for one effect tag; unknown tags pass through. */
export const describeEffectTag = (tag: EffectTag): string => EFFECT_LABELS[tag] ?? tag;

/**
 * Decodes an effects list into one human-readable action summary, e.g.
 * `["ledger", "balances"]` → "Updated the ledger and account balances".
 */
export const summarizeEffects = (effects: readonly EffectTag[]): string => {
  if (effects.length === 0) {
    return "Updated household data";
  }
  const labels = effects.map(describeEffectTag);
  if (labels.length === 1) {
    return `Updated ${labels[0]}`;
  }
  if (labels.length === 2) {
    return `Updated ${labels[0]} and ${labels[1]}`;
  }
  const head = labels.slice(0, -1).join(", ");
  return `Updated ${head}, and ${labels[labels.length - 1]}`;
};
