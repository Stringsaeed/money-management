import type { V2Category, V2Envelope } from "@trove/api/v2/contracts";

import { CATEGORY_ICONS } from "@/ui/trove";

/** A Category's icon when it is the person's own emoji, not a Trove icon name like "groceries". */
export function categoryEmoji(category: Pick<V2Category, "icon"> | undefined): string | undefined {
  const icon = category?.icon.trim();
  if (!icon || Object.hasOwn(CATEGORY_ICONS, icon)) return undefined;
  return icon;
}

/** Envelopes carry no emoji of their own: they wear the first mapped Category's emoji. */
export function envelopeEmoji(
  envelope: Pick<V2Envelope, "categoryIds">,
  categories: readonly V2Category[],
): string | undefined {
  for (const id of envelope.categoryIds) {
    const emoji = categoryEmoji(categories.find((category) => category.id === id));
    if (emoji) return emoji;
  }
  return undefined;
}
