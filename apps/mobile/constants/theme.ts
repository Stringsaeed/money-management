/**
 * ⚠️ SUPERSEDED by lib/design-tokens.ts
 *
 * This is the legacy Expo-template color palette. Its values differ from
 * the live Tailwind theme (global.css) and the SVG palette mirror.
 *
 * New code should use lib/design-tokens.ts instead, which:
 * - Consolidates all three divergent color sources
 * - Is hook-free (usable in StyleSheet.create)
 * - Resolves light/dark natively via DynamicColorIOS (iOS) and PlatformColor (Android)
 *
 * This file is retained for existing components during the migration.
 * See: https://github.com/Stringsaeed/money-management/issues/279
 */

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    // Semantic tokens
    card: "#F8F9FA",
    border: "#E5E7EB",
    muted: "#6B7280",
    income: "#16A34A",
    expense: "#DC2626",
    transfer: "#7C3AED",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    // Semantic tokens
    card: "#1F2937",
    border: "#374151",
    muted: "#9CA3AF",
    income: "#22C55E",
    expense: "#EF4444",
    transfer: "#A78BFA",
  },
} as const;

// Account type colors (same in both modes)
export const AccountTypeColors: Record<string, string> = {
  checking: "#4A90D9",
  savings: "#27AE60",
  cash: "#F39C12",
  credit_card: "#E74C3C",
  investment: "#8E44AD",
  other: "#7F8C8D",
};

// Preset palette for user-selected account/category colors (hex values, stored in DB)
export const ColorPalette = [
  "#8E44AD",
  "#3498DB",
  "#D62728",
  "#D35400",
  "#4A90D9",
  "#2ECC71",
  "#F1C40F",
];
