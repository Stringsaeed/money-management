import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import type { EnvelopeLine } from "../home/home-model";

import { occurrenceKey } from "./due-model";

export type Readiness =
  /** Not a budget expense the envelopes know: another currency, or no mapped Category. */
  | { readonly kind: "none" }
  | { readonly kind: "ready"; readonly envelope: string }
  | { readonly kind: "short"; readonly envelope: string; readonly shortMinor: number };

/** The active envelope a bill's Category maps to, if any. */
export function billEnvelope(
  item: Pick<V2DueOccurrence, "categoryId" | "currency">,
  lines: readonly EnvelopeLine[],
  budgetCurrency: string,
): EnvelopeLine | null {
  const { categoryId } = item;
  if (!categoryId || item.currency !== budgetCurrency) return null;
  return lines.find((line) => line.envelope.categoryIds.includes(categoryId)) ?? null;
}

/**
 * Whether each pending bill's envelope holds enough for it, earliest bill first: two bills on one
 * envelope share what it has left, so the later one can come up short even if each fits alone.
 */
export function billReadiness(
  items: readonly V2DueOccurrence[],
  lines: readonly EnvelopeLine[],
  budgetCurrency: string,
): Map<string, Readiness> {
  const remaining = new Map(lines.map((line) => [line.envelope.id, line.totals.leftMinor]));
  const byDate = [...items].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const result = new Map<string, Readiness>();
  for (const item of byDate) {
    const line = billEnvelope(item, lines, budgetCurrency);
    if (!line) {
      result.set(occurrenceKey(item), { kind: "none" });
      continue;
    }
    const before = remaining.get(line.envelope.id) ?? 0;
    const after = before - item.amountMinor;
    remaining.set(line.envelope.id, after);
    const envelope = line.envelope.name;
    result.set(
      occurrenceKey(item),
      after >= 0
        ? { kind: "ready", envelope }
        : { kind: "short", envelope, shortMinor: Math.min(item.amountMinor, -after) },
    );
  }
  return result;
}
