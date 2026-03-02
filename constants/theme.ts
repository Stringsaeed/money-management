/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

import { Platform } from "react-native";

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
  "#4A90D9",
  "#27AE60",
  "#F39C12",
  "#E74C3C",
  "#8E44AD",
  "#16A085",
  "#2980B9",
  "#D35400",
  "#C0392B",
  "#1ABC9C",
  "#F1C40F",
  "#E67E22",
  "#2ECC71",
  "#3498DB",
  "#9B59B6",
  "#1F77B4",
  "#FF7F0E",
  "#2CA02C",
  "#D62728",
  "#9467BD",
];

// ─── Manrope font family constants ───────────────────────────────────────────
//
// These match the font names registered via @expo-google-fonts/manrope.
// Use these values if you ever need to reference a specific Manrope weight
// outside of the shared <Text /> component (e.g. in TextInput styles).
export const ManropeFonts = {
  extraLight: "Manrope_200ExtraLight",
  light: "Manrope_300Light",
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semiBold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extraBold: "Manrope_800ExtraBold",
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
