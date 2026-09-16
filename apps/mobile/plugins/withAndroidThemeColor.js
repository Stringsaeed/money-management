/**
 * Expo Config Plugin: withAndroidThemeColor
 *
 * Injects design token colors into Android color resources during prebuild
 * using Expo's stock color mods (not withDangerousMod).
 *
 * This plugin:
 * 1. Uses withAndroidColors to add light mode colors to values/colors.xml
 * 2. Uses withAndroidColorsNight to add dark mode colors to values-night/colors.xml
 * 3. Uses AndroidConfig.Colors.assignColorValue to set each color
 *
 * NOTE: Color values are duplicated here from lib/design-tokens.ts because
 * that module uses React Native APIs (DynamicColorIOS, PlatformColor) that
 * can't be imported in a Node.js config plugin context. Keep these in sync.
 */

const {
  withAndroidColors,
  withAndroidColorsNight,
  AndroidConfig,
} = require("@expo/config-plugins");

// Color values mirrored from lib/design-tokens.ts rawColorValues
// Keep in sync when design tokens change.
const colorValues = {
  light: {
    surface: "#f5f5f0",
    surfaceContainer: "#e6ede7",
    surfaceDim: "#d9e4db",
    ink: "#2c5f47",
    sage: "#4a8f69",
    terracotta: "#d46a4c",
    ledgerOutline: "#d5e0d7",
    background: "#f5f5f0",
    foreground: "#2c5f47",
    card: "#f5f5f0",
    cardForeground: "#2c5f47",
    popover: "#ffffff",
    popoverForeground: "#2c5f47",
    primary: "#2c5f47",
    primaryForeground: "#f5f5f0",
    secondary: "#7ca68a",
    secondaryForeground: "#16331f",
    muted: "#eaf0eb",
    mutedForeground: "#6e8a7c",
    accent: "#dce7de",
    accentForeground: "#2c5f47",
    destructive: "#c4452f",
    border: "#cfddd2",
    input: "#cfddd2",
    brand: "#4a8f69",
    brandForeground: "#ffffff",
    textDefault: "#1c1917",
    textStrong: "#0c0a09",
    textSubtle: "#737373",
    textInactive: "#d4d4d4",
    textPlaceholder: "#a3a3a3",
    textInverse: "#f5f5f5",
    textBrand: "#f6821f",
    textLink: "#1e3a8a",
    textInfo: "#1e3a8a",
    textSuccess: "#166534",
    textWarning: "#b45309",
    textDanger: "#b91c1c",
    kumoCanvas: "#fafafa",
    kumoBase: "#ffffff",
    kumoElevated: "#fafafa",
    kumoRecessed: "#f5f5f5",
    kumoTint: "#f5f5f5",
    kumoContrast: "#171717",
    kumoOverlay: "#fafafa",
    kumoControl: "#ffffff",
    kumoInteract: "#d4d4d4",
    kumoFill: "#e5e5e5",
    kumoFillHover: "#f5f5f5",
    kumoBrand: "#2563eb",
    kumoBrandHover: "#1d4ed8",
    kumoLine: "#1a1a1a1a",
    kumoHairline: "#e5e5e5",
    kumoFocus: "#171717",
    kumoShadowEdge: "#1f000000",
    kumoShadowDrop: "#14000000",
    kumoInfo: "#3b82f6",
    kumoInfoTint: "#73dbeafe",
    kumoSuccess: "#10b981",
    kumoSuccessTint: "#91d1fae5",
    kumoWarning: "#f59e0b",
    kumoWarningTint: "#33fef3c7",
    kumoDanger: "#ef4444",
    kumoDangerTint: "#6bfee2e2",
    kumoBrandEmphasisStart: "#5b8def",
    kumoBrandEmphasisEnd: "#2563eb",
    kumoBrandEmphasisHover: "#85abf3",
    kumoBrandEmphasisEdge: "#85abf3",
    kumoDangerEmphasisStart: "#f26b6b",
    kumoDangerEmphasisEnd: "#ef4444",
    kumoDangerEmphasisHover: "#f59393",
    kumoDangerEmphasisEdge: "#f59393",
    badgeRed: "#dc2626",
    badgeGreen: "#10b981",
    badgeOrange: "#f97316",
    badgePurple: "#9333ea",
    badgeTeal: "#14b8a6",
    badgeBlue: "#2563eb",
    badgeNeutral: "#737373",
    badgeInverted: "#0c0a09",
    badgeOrangeSubtleText: "#9a3412",
    badgeTealSubtleText: "#115e59",
    badgeNeutralSubtleText: "#262626",
    badgeInvertedText: "#ffffff",
    income: "#16a34a",
    expense: "#dc2626",
    transfer: "#7c3aed",
    placeholder: "#9aada1",
  },
  dark: {
    surface: "#0f1a14",
    surfaceContainer: "#18241c",
    surfaceDim: "#223029",
    ink: "#d6e8dc",
    sage: "#6fb58a",
    terracotta: "#e0816a",
    ledgerOutline: "#2a3a31",
    background: "#0f1a14",
    foreground: "#d6e8dc",
    card: "#18241c",
    cardForeground: "#d6e8dc",
    popover: "#18241c",
    popoverForeground: "#d6e8dc",
    primary: "#d6e8dc",
    primaryForeground: "#0f1a14",
    secondary: "#7ca68a",
    secondaryForeground: "#0f1a14",
    muted: "#1f2c24",
    mutedForeground: "#8fae9d",
    accent: "#1f2c24",
    accentForeground: "#d6e8dc",
    destructive: "#e0644e",
    border: "#2a3a31",
    input: "#2a3a31",
    brand: "#6fb58a",
    brandForeground: "#ffffff",
    textDefault: "#f5f5f5",
    textStrong: "#fafafa",
    textSubtle: "#a3a3a3",
    textInactive: "#525252",
    textPlaceholder: "#737373",
    textInverse: "#171717",
    textBrand: "#f6821f",
    textLink: "#60a5fa",
    textInfo: "#60a5fa",
    textSuccess: "#a7f3d0",
    textWarning: "#fb923c",
    textDanger: "#f87171",
    kumoCanvas: "#0a0a0a",
    kumoBase: "#171717",
    kumoElevated: "#0f0f0f",
    kumoRecessed: "#141414",
    kumoTint: "#262626",
    kumoContrast: "#fafafa",
    kumoOverlay: "#262626",
    kumoControl: "#1c1917",
    kumoInteract: "#404040",
    kumoFill: "#262626",
    kumoFillHover: "#404040",
    kumoBrand: "#1e5fcc",
    kumoBrandHover: "#1d4ed8",
    kumoLine: "#3f3f46",
    kumoHairline: "#262626",
    kumoFocus: "#e5e5e5",
    kumoShadowEdge: "#1affffff",
    kumoShadowDrop: "#4d000000",
    kumoInfo: "#3b82f6",
    kumoInfoTint: "#381e3a8a",
    kumoSuccess: "#34d399",
    kumoSuccessTint: "#33052e16",
    kumoWarning: "#d97706",
    kumoWarningTint: "#5e4e2e09",
    kumoDanger: "#dc2626",
    kumoDangerTint: "#2b7f1d1d",
    kumoBrandEmphasisStart: "#3d71c7",
    kumoBrandEmphasisEnd: "#1e5fcc",
    kumoBrandEmphasisHover: "#5c8ad0",
    kumoBrandEmphasisEdge: "#5c8ad0",
    kumoDangerEmphasisStart: "#e04646",
    kumoDangerEmphasisEnd: "#dc2626",
    kumoDangerEmphasisHover: "#e77171",
    kumoDangerEmphasisEdge: "#e77171",
    badgeRed: "#b91c1c",
    badgeGreen: "#047857",
    badgeOrange: "#f97316",
    badgePurple: "#7e22ce",
    badgeTeal: "#0f766e",
    badgeBlue: "#1d4ed8",
    badgeNeutral: "#525252",
    badgeInverted: "#ffffff",
    badgeOrangeSubtleText: "#fed7aa",
    badgeTealSubtleText: "#ccfbf1",
    badgeNeutralSubtleText: "#e5e5e5",
    badgeInvertedText: "#000000",
    income: "#22c55e",
    expense: "#ef4444",
    transfer: "#a78bfa",
    placeholder: "#5d7568",
  },
};

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function withDesignTokenColors(config, colors) {
  for (const [key, value] of Object.entries(colors)) {
    const colorName = `design_token_${camelToSnake(key)}`;
    config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, {
      name: colorName,
      value: value.toUpperCase(),
    });
  }
  return config;
}

const withAndroidThemeColor = (config) => {
  // Add light mode colors to values/colors.xml
  config = withAndroidColors(config, (config) => {
    return withDesignTokenColors(config, colorValues.light);
  });

  // Add dark mode colors to values-night/colors.xml
  config = withAndroidColorsNight(config, (config) => {
    return withDesignTokenColors(config, colorValues.dark);
  });

  return config;
};

module.exports = withAndroidThemeColor;
