import type { ColorValue } from "react-native";

import { colors } from "@/ui/design-tokens";

/**
 * Fixed colors for Tiled Garden actions and avatar accents.
 *
 * These accents are intentionally the same in light and dark appearance. Card
 * and chart surfaces use the canonical native-aware tokens instead.
 */
export const tileColors = {
  cream: "#F5EBD6",
  olive: "#CDD27A",
  pink: "#E5A4B7",
  ink: "#25231D",
  muted: "#746D60",
  grout: "#D5C9B1",
  white: "#FFFDF7",
} as const;

export const tileChartColors = {
  balance: colors.foreground,
  income: colors.foreground,
  expense: colors.mutedForeground,
  area: colors.muted,
  grid: colors.border,
} satisfies Record<string, ColorValue>;
