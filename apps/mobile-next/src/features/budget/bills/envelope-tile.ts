import type { V2Envelope, V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { CATEGORY_ICONS } from "@/ui/trove";

/** Trove category icons for an envelope whose Category has no emoji. */
const GROUP_ICON = {
  bills: "bills",
  everyday: "other",
  saving: "savings",
} as const satisfies Record<V2EnvelopeGroup, keyof typeof CATEGORY_ICONS>;

/**
 * What a row's round tile shows for an envelope: its first Category's emoji (or Trove icon
 * name), else its group's Trove icon. Legacy icon slugs Trove does not draw fall back too.
 */
export function envelopeTileIcon(
  envelope: Pick<V2Envelope, "group" | "categoryIds">,
  iconByCategoryId: ReadonlyMap<string, string>,
): string {
  const icon = envelope.categoryIds
    .map((id) => iconByCategoryId.get(id))
    .find((candidate) => candidate !== undefined && candidate !== "");
  if (icon === undefined) return GROUP_ICON[envelope.group];
  if (/^[\w-]+$/.test(icon) && !Object.hasOwn(CATEGORY_ICONS, icon)) {
    return GROUP_ICON[envelope.group];
  }
  return icon;
}
