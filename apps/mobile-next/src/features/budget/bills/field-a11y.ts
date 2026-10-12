import type { AccessibilityRole, AccessibilityState } from "react-native";

interface FieldButtonA11y {
  readonly accessibilityLabel: string;
  readonly accessibilityHint: string | undefined;
  readonly accessibilityRole: AccessibilityRole;
  readonly accessibilityState: AccessibilityState | undefined;
}

/** "Due date: Tue 1 Dec 2026", a button that changes it, expanded while its picker shows. */
export function fieldButtonA11y(
  label: string,
  value: string,
  pressable: boolean,
  expanded: boolean | undefined,
): FieldButtonA11y {
  return {
    accessibilityLabel: `${label}: ${value}`,
    accessibilityHint: pressable ? "Change" : undefined,
    accessibilityRole: pressable ? "button" : "text",
    accessibilityState: expanded === undefined ? undefined : { expanded },
  };
}
