/**
 * Expo Config Plugin: withAndroidThemeColor
 *
 * Generates Android color resources (default + night) during `pnpm prebuild`
 * so that PlatformColor can read design tokens natively.
 *
 * This plugin:
 * 1. Creates res/values/colors.xml with light mode color values
 * 2. Creates res/values-night/colors.xml with dark mode color values
 * 3. Uses the naming convention: design_token_<snake_case_key>
 *
 * The values survive a full prebuild cycle because the plugin regenerates
 * them each time, rather than relying on hand-edited files.
 */

const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Color definitions matching lib/design-tokens.ts
// This is the canonical source for raw hex values
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
    kumoShadowEdge: "#0000001f",
    kumoShadowDrop: "#00000014",
    kumoInfo: "#3b82f6",
    kumoInfoTint: "#dbeafe73",
    kumoSuccess: "#10b981",
    kumoSuccessTint: "#d1fae591",
    kumoWarning: "#f59e0b",
    kumoWarningTint: "#fef3c733",
    kumoDanger: "#ef4444",
    kumoDangerTint: "#fee2e26b",
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
    kumoShadowEdge: "#ffffff1a",
    kumoShadowDrop: "#0000004d",
    kumoInfo: "#3b82f6",
    kumoInfoTint: "#1e3a8a38",
    kumoSuccess: "#34d399",
    kumoSuccessTint: "#052e1633",
    kumoWarning: "#d97706",
    kumoWarningTint: "#4e2e095e",
    kumoDanger: "#dc2626",
    kumoDangerTint: "#7f1d1d2b",
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

function convertToAndroidColor(hexColor) {
  // Android colors: #AARRGGBB or #RRGGBB
  // Input may be: #RGB, #RGBA, #RRGGBB, #RRGGBBAA, or rgba() format

  if (hexColor.startsWith("rgba(")) {
    // Parse rgba(r, g, b, a) format
    const match = hexColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
    if (match) {
      const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
      const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
      const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
      const a = match[4]
        ? Math.round(parseFloat(match[4]) * 255)
            .toString(16)
            .padStart(2, "0")
        : "ff";
      return `#${a}${r}${g}${b}`.toUpperCase();
    }
  }

  // Handle hex colors
  let hex = hexColor.replace("#", "");

  // Expand short hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  } else if (hex.length === 4) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  // Convert RRGGBBAA to AARRGGBB (Android format)
  if (hex.length === 8) {
    const alpha = hex.slice(6, 8);
    const rgb = hex.slice(0, 6);
    return `#${alpha}${rgb}`.toUpperCase();
  }

  // Standard RRGGBB
  return `#${hex}`.toUpperCase();
}

function generateColorsXml(colors) {
  const entries = Object.entries(colors)
    .map(([key, value]) => {
      const name = `design_token_${camelToSnake(key)}`;
      const androidColor = convertToAndroidColor(value);
      return `    <color name="${name}">${androidColor}</color>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<!--
  Generated by withAndroidThemeColor Expo config plugin.
  Do not edit manually - regenerated on each prebuild.

  These color resources are read by PlatformColor in design-tokens.ts
  to provide native light/dark mode resolution on Android.
-->
<resources>
${entries}
</resources>
`;
}

const withAndroidThemeColor = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidResPath = path.join(projectRoot, "android", "app", "src", "main", "res");

      // Ensure directories exist
      const valuesDir = path.join(androidResPath, "values");
      const valuesNightDir = path.join(androidResPath, "values-night");

      if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, { recursive: true });
      }
      if (!fs.existsSync(valuesNightDir)) {
        fs.mkdirSync(valuesNightDir, { recursive: true });
      }

      // Generate light mode colors (values/design_tokens_colors.xml)
      const lightColorsPath = path.join(valuesDir, "design_tokens_colors.xml");
      const lightColorsXml = generateColorsXml(colorValues.light);
      fs.writeFileSync(lightColorsPath, lightColorsXml);

      // Generate dark mode colors (values-night/design_tokens_colors.xml)
      const darkColorsPath = path.join(valuesNightDir, "design_tokens_colors.xml");
      const darkColorsXml = generateColorsXml(colorValues.dark);
      fs.writeFileSync(darkColorsPath, darkColorsXml);

      console.log("[withAndroidThemeColor] Generated Android color resources:");
      console.log(`  - ${lightColorsPath}`);
      console.log(`  - ${darkColorsPath}`);

      return config;
    },
  ]);
};

module.exports = withAndroidThemeColor;
