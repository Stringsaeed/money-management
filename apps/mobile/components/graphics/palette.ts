/**
 * ⚠️ SUPERSEDED by lib/design-tokens.ts
 *
 * This hook-based palette was created because SVG props can't read CSS variables.
 * It duplicates colors from global.css and requires a React hook to resolve
 * the current color scheme.
 *
 * New code should use lib/design-tokens.ts instead, which:
 * - Is hook-free (usable in StyleSheet.create)
 * - Resolves light/dark natively via DynamicColorIOS (iOS) and PlatformColor (Android)
 * - Zero JS re-render on appearance change
 *
 * This file is retained for existing SVG components during the migration.
 * See: https://github.com/Stringsaeed/money-management/issues/279
 */

import { useColorScheme } from "@/hooks/use-color-scheme";

// Mirrors the Garden Ledger palette in global.css — SVG props can't read CSS variables.
const light = {
  ink: "#2c5f47",
  sage: "#4a8f69",
  terracotta: "#d46a4c",
  surfaceDim: "#d9e4db",
  outline: "#cfddd2",
  placeholder: "#9aada1",
};

const dark = {
  ink: "#d6e8dc",
  sage: "#6fb58a",
  terracotta: "#e0816a",
  surfaceDim: "#223029",
  outline: "#2a3a31",
  placeholder: "#5d7568",
};

export type GraphicPalette = typeof light;

export function useGraphicPalette(): GraphicPalette {
  return useColorScheme() === "dark" ? dark : light;
}
