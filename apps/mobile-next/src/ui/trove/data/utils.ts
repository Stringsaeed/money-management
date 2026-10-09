import { CATEGORY_ICONS, type CategoryIconName } from "../icon";

/** A category carries either a Trove icon name or (for user categories) an emoji. */
export function isCategoryIconName(icon: string): icon is CategoryIconName {
  return Object.hasOwn(CATEGORY_ICONS, icon);
}

/** One spoken line for a row: title, subtitle, amount. */
export function joinSpoken(parts: readonly (string | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part)).join(", ");
}
