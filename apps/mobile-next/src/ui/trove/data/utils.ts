import { CATEGORY_ICONS, type CategoryIconName } from "../icon";

/** A category carries either a Trove icon name or (for user categories) an emoji. */
export function isCategoryIconName(icon: string): icon is CategoryIconName {
  return Object.hasOwn(CATEGORY_ICONS, icon);
}

/** One spoken line for a row: title, subtitle, amount. */
export function joinSpoken(parts: readonly (string | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part)).join(", ");
}

/**
 * Accessibility props of a list row. A selectable row (`checked` set) is a `checkbox` with that
 * state, labelled by its title unless a label is given.
 */
export function selectableRowProps(input: {
  checked?: boolean;
  disabled: boolean;
  title: string;
  accessibilityLabel?: string;
}) {
  const { checked, disabled, title, accessibilityLabel } = input;
  if (checked === undefined) return { accessibilityLabel };
  return {
    accessibilityLabel: accessibilityLabel ?? title,
    accessibilityRole: "checkbox" as const,
    accessibilityState: { checked, disabled },
  };
}
