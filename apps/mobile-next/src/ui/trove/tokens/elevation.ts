import type { ViewStyle } from "react-native";

import { colors } from "./colors";

/**
 * Light mode lifts with soft shadow; dark mode lifts with lighter surfaces and a ring,
 * because shadows disappear on near-black. Shadow and ring colors are dynamic tokens
 * (dark shadows are transparent), so one style serves both modes.
 * Pair level2/level3 with `surface.raised`.
 */
export const elevation = {
  /** Flat — hairline only. */
  level0: {
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  /** Cards. */
  level1: {
    borderColor: colors.elevation.ring1,
    borderWidth: 1,
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: colors.elevation.shadow1 }],
  },
  /** Menus, sheets. */
  level2: {
    borderColor: colors.elevation.ring2,
    borderWidth: 1,
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 24, color: colors.elevation.shadow2 }],
  },
  /** Modals — pair with a scrim. */
  level3: {
    borderColor: colors.elevation.ring2,
    borderWidth: 1,
    boxShadow: [{ offsetX: 0, offsetY: 16, blurRadius: 48, color: colors.elevation.shadow3 }],
  },
} as const satisfies Record<string, ViewStyle>;

export type ElevationLevel = keyof typeof elevation;
