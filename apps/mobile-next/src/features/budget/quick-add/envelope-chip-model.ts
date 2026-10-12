import type { V2Category } from "@trove/api/v2/contracts";

import { MINUS, wholeAmount } from "@/ui/trove";

import { categoriesById, envelopeEmoji } from "../envelope-emoji";
import type { EnvelopeLine } from "../home/home-model";

export interface EnvelopeChip {
  readonly id: string;
  readonly label: string;
  readonly emoji: string | undefined;
  /** Whole units left this period, e.g. "148"; "−20" once over. */
  readonly meta: string;
}

/** One chip per envelope, in the order given, with what is left printed after the name. */
export function envelopeChips(
  lines: readonly EnvelopeLine[],
  categories: readonly V2Category[],
  currency: string,
): EnvelopeChip[] {
  const categoryLookup = categoriesById(categories);
  return lines.map(({ envelope, totals }) => ({
    id: envelope.id,
    label: envelope.name,
    emoji: envelopeEmoji(envelope, categoryLookup) ?? undefined,
    meta: `${totals.leftMinor < 0 ? MINUS : ""}${wholeAmount(totals.leftMinor, currency)}`,
  }));
}
