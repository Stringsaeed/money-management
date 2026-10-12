import type { V2Category, V2Envelope, V2EnvelopeGroup } from "@trove/api/v2/contracts";

/** Category icons may be emoji or legacy icon slugs ("tag"); only emoji count. */
const isEmoji = (icon: string) => icon.length > 0 && !/^[\w-]+$/.test(icon);

/**
 * The envelope's emoji: the first of its Categories that has one. Envelopes carry no emoji of
 * their own, so this is the user's Category data; `null` when none of them has one.
 */
export function envelopeEmoji(
  envelope: Pick<V2Envelope, "categoryIds">,
  categories: readonly Pick<V2Category, "id" | "icon">[],
): string | null {
  const icons = new Map(categories.map((category) => [category.id, category.icon]));
  for (const id of envelope.categoryIds) {
    const icon = icons.get(id);
    if (icon && isEmoji(icon)) return icon;
  }
  return null;
}

/** Design emoji for a group, for Trove `emoji` props when an envelope has none of its own. */
export const GROUP_EMOJI = {
  bills: "🧾",
  everyday: "🛒",
  saving: "🏠",
} as const satisfies Record<V2EnvelopeGroup, string>;

export const GROUP_LABEL = {
  bills: "Bills",
  everyday: "Everyday",
  saving: "Saving for",
} as const satisfies Record<V2EnvelopeGroup, string>;

export const GROUP_ORDER: readonly V2EnvelopeGroup[] = ["bills", "everyday", "saving"];
