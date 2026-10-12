import type { V2Category, V2Envelope } from "@trove/api/v2/contracts";

import { categoryEmoji } from "@/features/ledger/categories/category-emoji";

/** An envelope's emoji: its first Category's, or the fallback tag. */
export function envelopeEmoji(
  envelope: Pick<V2Envelope, "categoryIds">,
  categoriesById: ReadonlyMap<string, Pick<V2Category, "icon">>,
): string {
  const category = envelope.categoryIds
    .map((id) => categoriesById.get(id))
    .find((found) => found !== undefined);
  return categoryEmoji(category?.icon);
}
