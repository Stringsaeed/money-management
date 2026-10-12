import type { V2Category, V2Envelope } from "@trove/api/v2/contracts";

import {
  FALLBACK_CATEGORY_EMOJI,
  isCategoryEmoji,
} from "@/features/ledger/categories/category-emoji";

type CategoriesById = ReadonlyMap<string, Pick<V2Category, "icon">>;

/** Categories keyed by id, the lookup every envelope emoji reads. */
export function categoriesById<T extends Pick<V2Category, "id">>(
  categories: readonly T[],
): ReadonlyMap<string, T> {
  return new Map(categories.map((category) => [category.id, category]));
}

/**
 * The Category's own emoji, or `null` when it has none: a missing or blank icon, a legacy icon
 * slug ("tag"), or a Trove icon name ("groceries"). Same rule as Ledger's `categoryEmoji`.
 */
export function ownCategoryEmoji(category: Pick<V2Category, "icon"> | undefined): string | null {
  const icon = category?.icon.trim();
  return isCategoryEmoji(icon) ? icon : null;
}

/**
 * Envelopes carry no emoji of their own: they wear the first mapped Category's emoji, skipping
 * Categories without one. `null` when none of them has one.
 */
export function envelopeEmoji(
  envelope: Pick<V2Envelope, "categoryIds">,
  categories: CategoriesById,
): string | null {
  for (const id of envelope.categoryIds) {
    const emoji = ownCategoryEmoji(categories.get(id));
    if (emoji) return emoji;
  }
  return null;
}

/** `envelopeEmoji`, or the tag every uncategorised row shows. */
export function envelopeEmojiOrTag(
  envelope: Pick<V2Envelope, "categoryIds">,
  categories: CategoriesById,
): string {
  return envelopeEmoji(envelope, categories) ?? FALLBACK_CATEGORY_EMOJI;
}
