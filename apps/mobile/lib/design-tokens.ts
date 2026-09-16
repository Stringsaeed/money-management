/**
 * Canonical Design Token Module
 *
 * This module consolidates the app's design tokens into a single, hook-free
 * source of truth. Colors resolve natively to light/dark on both iOS and Android
 * with zero JS re-render.
 *
 * iOS: DynamicColorIOS wraps light/dark pairs for native resolution.
 * Android: PlatformColor reads from native color resources (default + night).
 *
 * SUPERSEDES:
 * - global.css @theme (Tailwind/NativeWind CSS variables)
 * - components/graphics/palette.ts (SVG-palette mirror)
 * - constants/theme.ts (legacy Expo-template palette)
 *
 * All hex values were converted from OKLCH where applicable.
 */

/* oxlint-disable @react-native/platform-colors -- dynamicColor helper wraps platform APIs with variables intentionally */

import type { ColorValue } from "react-native";
import { DynamicColorIOS, Platform, PlatformColor } from "react-native";

// -----------------------------------------------------------------------------
// Raw Color Values (hex, usable for non-native contexts)
// -----------------------------------------------------------------------------

export const rawColorValues = {
  light: {
    // Garden Ledger palette
    surface: "#f5f5f0",
    surfaceContainer: "#e6ede7",
    surfaceDim: "#d9e4db",
    ink: "#2c5f47",
    sage: "#4a8f69",
    terracotta: "#d46a4c",
    ledgerOutline: "#d5e0d7",

    // Semantic surfaces
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

    // Kumo text colors (converted from OKLCH)
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

    // Kumo surfaces (converted from OKLCH)
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

    // Kumo borders/rings (converted from OKLCH)
    kumoLine: "rgba(0, 0, 0, 0.1)",
    kumoHairline: "#e5e5e5",
    kumoFocus: "#171717",
    kumoShadowEdge: "rgba(0, 0, 0, 0.12)",
    kumoShadowDrop: "rgba(0, 0, 0, 0.08)",

    // Kumo status colors (converted from OKLCH)
    kumoInfo: "#3b82f6",
    kumoInfoTint: "rgba(219, 234, 254, 0.45)",
    kumoSuccess: "#10b981",
    kumoSuccessTint: "rgba(209, 250, 229, 0.57)",
    kumoWarning: "#f59e0b",
    kumoWarningTint: "rgba(254, 243, 199, 0.2)",
    kumoDanger: "#ef4444",
    kumoDangerTint: "rgba(254, 226, 226, 0.42)",

    // Emphasis fills (pre-computed from color-mix)
    kumoBrandEmphasisStart: "#5b8def",
    kumoBrandEmphasisEnd: "#2563eb",
    kumoBrandEmphasisHover: "#85abf3",
    kumoBrandEmphasisEdge: "#85abf3",
    kumoDangerEmphasisStart: "#f26b6b",
    kumoDangerEmphasisEnd: "#ef4444",
    kumoDangerEmphasisHover: "#f59393",
    kumoDangerEmphasisEdge: "#f59393",

    // Badge colors (converted from OKLCH)
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

    // Transaction semantic colors
    income: "#16a34a",
    expense: "#dc2626",
    transfer: "#7c3aed",

    // Graphics placeholder
    placeholder: "#9aada1",
  },

  dark: {
    // Garden Ledger palette
    surface: "#0f1a14",
    surfaceContainer: "#18241c",
    surfaceDim: "#223029",
    ink: "#d6e8dc",
    sage: "#6fb58a",
    terracotta: "#e0816a",
    ledgerOutline: "#2a3a31",

    // Semantic surfaces
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

    // Kumo text colors (dark mode, converted from OKLCH)
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

    // Kumo surfaces (dark mode, converted from OKLCH)
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

    // Kumo borders/rings (dark mode, converted from OKLCH)
    kumoLine: "#3f3f46",
    kumoHairline: "#262626",
    kumoFocus: "#e5e5e5",
    kumoShadowEdge: "rgba(255, 255, 255, 0.1)",
    kumoShadowDrop: "rgba(0, 0, 0, 0.3)",

    // Kumo status colors (dark mode, converted from OKLCH)
    kumoInfo: "#3b82f6",
    kumoInfoTint: "rgba(30, 58, 138, 0.22)",
    kumoSuccess: "#34d399",
    kumoSuccessTint: "rgba(5, 46, 22, 0.2)",
    kumoWarning: "#d97706",
    kumoWarningTint: "rgba(78, 46, 9, 0.37)",
    kumoDanger: "#dc2626",
    kumoDangerTint: "rgba(127, 29, 29, 0.17)",

    // Emphasis fills (dark mode, pre-computed from color-mix)
    kumoBrandEmphasisStart: "#3d71c7",
    kumoBrandEmphasisEnd: "#1e5fcc",
    kumoBrandEmphasisHover: "#5c8ad0",
    kumoBrandEmphasisEdge: "#5c8ad0",
    kumoDangerEmphasisStart: "#e04646",
    kumoDangerEmphasisEnd: "#dc2626",
    kumoDangerEmphasisHover: "#e77171",
    kumoDangerEmphasisEdge: "#e77171",

    // Badge colors (dark mode, converted from OKLCH)
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

    // Transaction semantic colors
    income: "#22c55e",
    expense: "#ef4444",
    transfer: "#a78bfa",

    // Graphics placeholder
    placeholder: "#5d7568",
  },
} as const;

// -----------------------------------------------------------------------------
// Helper to create platform-specific dynamic colors
// -----------------------------------------------------------------------------

type ColorKey = keyof typeof rawColorValues.light;

function dynamicColor(light: string, dark: string, androidKey: string): ColorValue {
  if (Platform.OS === "ios") {
    return DynamicColorIOS({ light, dark });
  }
  if (Platform.OS === "android") {
    return PlatformColor(androidKey);
  }
  // Fallback for other platforms (web, etc.)
  return light;
}

// -----------------------------------------------------------------------------
// Platform-Specific Dynamic Colors
// ColorValue type is used to accept both string literals and OpaqueColorValue
// from DynamicColorIOS/PlatformColor, which StyleSheet.create accepts.
// -----------------------------------------------------------------------------

const colors = {
  // Garden Ledger palette
  surface: dynamicColor("#f5f5f0", "#0f1a14", "@color/design_token_surface"),
  surfaceContainer: dynamicColor("#e6ede7", "#18241c", "@color/design_token_surface_container"),
  surfaceDim: dynamicColor("#d9e4db", "#223029", "@color/design_token_surface_dim"),
  ink: dynamicColor("#2c5f47", "#d6e8dc", "@color/design_token_ink"),
  sage: dynamicColor("#4a8f69", "#6fb58a", "@color/design_token_sage"),
  terracotta: dynamicColor("#d46a4c", "#e0816a", "@color/design_token_terracotta"),
  ledgerOutline: dynamicColor("#d5e0d7", "#2a3a31", "@color/design_token_ledger_outline"),

  // Semantic surfaces
  background: dynamicColor("#f5f5f0", "#0f1a14", "@color/design_token_background"),
  foreground: dynamicColor("#2c5f47", "#d6e8dc", "@color/design_token_foreground"),
  card: dynamicColor("#f5f5f0", "#18241c", "@color/design_token_card"),
  cardForeground: dynamicColor("#2c5f47", "#d6e8dc", "@color/design_token_card_foreground"),
  popover: dynamicColor("#ffffff", "#18241c", "@color/design_token_popover"),
  popoverForeground: dynamicColor("#2c5f47", "#d6e8dc", "@color/design_token_popover_foreground"),
  primary: dynamicColor("#2c5f47", "#d6e8dc", "@color/design_token_primary"),
  primaryForeground: dynamicColor("#f5f5f0", "#0f1a14", "@color/design_token_primary_foreground"),
  secondary: dynamicColor("#7ca68a", "#7ca68a", "@color/design_token_secondary"),
  secondaryForeground: dynamicColor(
    "#16331f",
    "#0f1a14",
    "@color/design_token_secondary_foreground",
  ),
  muted: dynamicColor("#eaf0eb", "#1f2c24", "@color/design_token_muted"),
  mutedForeground: dynamicColor("#6e8a7c", "#8fae9d", "@color/design_token_muted_foreground"),
  accent: dynamicColor("#dce7de", "#1f2c24", "@color/design_token_accent"),
  accentForeground: dynamicColor("#2c5f47", "#d6e8dc", "@color/design_token_accent_foreground"),
  destructive: dynamicColor("#c4452f", "#e0644e", "@color/design_token_destructive"),
  border: dynamicColor("#cfddd2", "#2a3a31", "@color/design_token_border"),
  input: dynamicColor("#cfddd2", "#2a3a31", "@color/design_token_input"),
  brand: dynamicColor("#4a8f69", "#6fb58a", "@color/design_token_brand"),
  brandForeground: dynamicColor("#ffffff", "#ffffff", "@color/design_token_brand_foreground"),

  // Kumo text colors
  textDefault: dynamicColor("#1c1917", "#f5f5f5", "@color/design_token_text_default"),
  textStrong: dynamicColor("#0c0a09", "#fafafa", "@color/design_token_text_strong"),
  textSubtle: dynamicColor("#737373", "#a3a3a3", "@color/design_token_text_subtle"),
  textInactive: dynamicColor("#d4d4d4", "#525252", "@color/design_token_text_inactive"),
  textPlaceholder: dynamicColor("#a3a3a3", "#737373", "@color/design_token_text_placeholder"),
  textInverse: dynamicColor("#f5f5f5", "#171717", "@color/design_token_text_inverse"),
  textBrand: dynamicColor("#f6821f", "#f6821f", "@color/design_token_text_brand"),
  textLink: dynamicColor("#1e3a8a", "#60a5fa", "@color/design_token_text_link"),
  textInfo: dynamicColor("#1e3a8a", "#60a5fa", "@color/design_token_text_info"),
  textSuccess: dynamicColor("#166534", "#a7f3d0", "@color/design_token_text_success"),
  textWarning: dynamicColor("#b45309", "#fb923c", "@color/design_token_text_warning"),
  textDanger: dynamicColor("#b91c1c", "#f87171", "@color/design_token_text_danger"),

  // Kumo surfaces
  kumoCanvas: dynamicColor("#fafafa", "#0a0a0a", "@color/design_token_kumo_canvas"),
  kumoBase: dynamicColor("#ffffff", "#171717", "@color/design_token_kumo_base"),
  kumoElevated: dynamicColor("#fafafa", "#0f0f0f", "@color/design_token_kumo_elevated"),
  kumoRecessed: dynamicColor("#f5f5f5", "#141414", "@color/design_token_kumo_recessed"),
  kumoTint: dynamicColor("#f5f5f5", "#262626", "@color/design_token_kumo_tint"),
  kumoContrast: dynamicColor("#171717", "#fafafa", "@color/design_token_kumo_contrast"),
  kumoOverlay: dynamicColor("#fafafa", "#262626", "@color/design_token_kumo_overlay"),
  kumoControl: dynamicColor("#ffffff", "#1c1917", "@color/design_token_kumo_control"),
  kumoInteract: dynamicColor("#d4d4d4", "#404040", "@color/design_token_kumo_interact"),
  kumoFill: dynamicColor("#e5e5e5", "#262626", "@color/design_token_kumo_fill"),
  kumoFillHover: dynamicColor("#f5f5f5", "#404040", "@color/design_token_kumo_fill_hover"),
  kumoBrand: dynamicColor("#2563eb", "#1e5fcc", "@color/design_token_kumo_brand"),
  kumoBrandHover: dynamicColor("#1d4ed8", "#1d4ed8", "@color/design_token_kumo_brand_hover"),

  // Kumo borders/rings (note: rgba colors use hex on Android)
  kumoLine: dynamicColor("rgba(0, 0, 0, 0.1)", "#3f3f46", "@color/design_token_kumo_line"),
  kumoHairline: dynamicColor("#e5e5e5", "#262626", "@color/design_token_kumo_hairline"),
  kumoFocus: dynamicColor("#171717", "#e5e5e5", "@color/design_token_kumo_focus"),
  kumoShadowEdge: dynamicColor(
    "rgba(0, 0, 0, 0.12)",
    "rgba(255, 255, 255, 0.1)",
    "@color/design_token_kumo_shadow_edge",
  ),
  kumoShadowDrop: dynamicColor(
    "rgba(0, 0, 0, 0.08)",
    "rgba(0, 0, 0, 0.3)",
    "@color/design_token_kumo_shadow_drop",
  ),

  // Kumo status colors
  kumoInfo: dynamicColor("#3b82f6", "#3b82f6", "@color/design_token_kumo_info"),
  kumoInfoTint: dynamicColor(
    "rgba(219, 234, 254, 0.45)",
    "rgba(30, 58, 138, 0.22)",
    "@color/design_token_kumo_info_tint",
  ),
  kumoSuccess: dynamicColor("#10b981", "#34d399", "@color/design_token_kumo_success"),
  kumoSuccessTint: dynamicColor(
    "rgba(209, 250, 229, 0.57)",
    "rgba(5, 46, 22, 0.2)",
    "@color/design_token_kumo_success_tint",
  ),
  kumoWarning: dynamicColor("#f59e0b", "#d97706", "@color/design_token_kumo_warning"),
  kumoWarningTint: dynamicColor(
    "rgba(254, 243, 199, 0.2)",
    "rgba(78, 46, 9, 0.37)",
    "@color/design_token_kumo_warning_tint",
  ),
  kumoDanger: dynamicColor("#ef4444", "#dc2626", "@color/design_token_kumo_danger"),
  kumoDangerTint: dynamicColor(
    "rgba(254, 226, 226, 0.42)",
    "rgba(127, 29, 29, 0.17)",
    "@color/design_token_kumo_danger_tint",
  ),

  // Emphasis fills
  kumoBrandEmphasisStart: dynamicColor(
    "#5b8def",
    "#3d71c7",
    "@color/design_token_kumo_brand_emphasis_start",
  ),
  kumoBrandEmphasisEnd: dynamicColor(
    "#2563eb",
    "#1e5fcc",
    "@color/design_token_kumo_brand_emphasis_end",
  ),
  kumoBrandEmphasisHover: dynamicColor(
    "#85abf3",
    "#5c8ad0",
    "@color/design_token_kumo_brand_emphasis_hover",
  ),
  kumoBrandEmphasisEdge: dynamicColor(
    "#85abf3",
    "#5c8ad0",
    "@color/design_token_kumo_brand_emphasis_edge",
  ),
  kumoDangerEmphasisStart: dynamicColor(
    "#f26b6b",
    "#e04646",
    "@color/design_token_kumo_danger_emphasis_start",
  ),
  kumoDangerEmphasisEnd: dynamicColor(
    "#ef4444",
    "#dc2626",
    "@color/design_token_kumo_danger_emphasis_end",
  ),
  kumoDangerEmphasisHover: dynamicColor(
    "#f59393",
    "#e77171",
    "@color/design_token_kumo_danger_emphasis_hover",
  ),
  kumoDangerEmphasisEdge: dynamicColor(
    "#f59393",
    "#e77171",
    "@color/design_token_kumo_danger_emphasis_edge",
  ),

  // Badge colors
  badgeRed: dynamicColor("#dc2626", "#b91c1c", "@color/design_token_badge_red"),
  badgeGreen: dynamicColor("#10b981", "#047857", "@color/design_token_badge_green"),
  badgeOrange: dynamicColor("#f97316", "#f97316", "@color/design_token_badge_orange"),
  badgePurple: dynamicColor("#9333ea", "#7e22ce", "@color/design_token_badge_purple"),
  badgeTeal: dynamicColor("#14b8a6", "#0f766e", "@color/design_token_badge_teal"),
  badgeBlue: dynamicColor("#2563eb", "#1d4ed8", "@color/design_token_badge_blue"),
  badgeNeutral: dynamicColor("#737373", "#525252", "@color/design_token_badge_neutral"),
  badgeInverted: dynamicColor("#0c0a09", "#ffffff", "@color/design_token_badge_inverted"),
  badgeOrangeSubtleText: dynamicColor(
    "#9a3412",
    "#fed7aa",
    "@color/design_token_badge_orange_subtle_text",
  ),
  badgeTealSubtleText: dynamicColor(
    "#115e59",
    "#ccfbf1",
    "@color/design_token_badge_teal_subtle_text",
  ),
  badgeNeutralSubtleText: dynamicColor(
    "#262626",
    "#e5e5e5",
    "@color/design_token_badge_neutral_subtle_text",
  ),
  badgeInvertedText: dynamicColor("#ffffff", "#000000", "@color/design_token_badge_inverted_text"),

  // Transaction semantic colors
  income: dynamicColor("#16a34a", "#22c55e", "@color/design_token_income"),
  expense: dynamicColor("#dc2626", "#ef4444", "@color/design_token_expense"),
  transfer: dynamicColor("#7c3aed", "#a78bfa", "@color/design_token_transfer"),

  // Graphics placeholder
  placeholder: dynamicColor("#9aada1", "#5d7568", "@color/design_token_placeholder"),
} satisfies Record<ColorKey, ColorValue>;

// -----------------------------------------------------------------------------
// Typography Tokens
// -----------------------------------------------------------------------------

const typography = {
  // Font families (Nunito for all)
  fontHeadingThin: Platform.select({ ios: "Nunito-ExtraLight", default: "Nunito_200ExtraLight" }),
  fontHeadingLight: Platform.select({ ios: "Nunito-Light", default: "Nunito_300Light" }),
  fontHeadingNormal: Platform.select({ ios: "Nunito-Regular", default: "Nunito_400Regular" }),
  fontHeadingMedium: Platform.select({ ios: "Nunito-Medium", default: "Nunito_500Medium" }),
  fontHeadingSemibold: Platform.select({ ios: "Nunito-SemiBold", default: "Nunito_600SemiBold" }),
  fontHeadingBold: Platform.select({ ios: "Nunito-Bold", default: "Nunito_700Bold" }),
  fontHeadingBlack: Platform.select({ ios: "Nunito-Black", default: "Nunito_900Black" }),

  fontBodyThin: Platform.select({ ios: "Nunito-ExtraLight", default: "Nunito_200ExtraLight" }),
  fontBodyLight: Platform.select({ ios: "Nunito-Light", default: "Nunito_300Light" }),
  fontBodyNormal: Platform.select({ ios: "Nunito-Regular", default: "Nunito_400Regular" }),
  fontBodyMedium: Platform.select({ ios: "Nunito-Medium", default: "Nunito_500Medium" }),
  fontBodySemibold: Platform.select({ ios: "Nunito-SemiBold", default: "Nunito_600SemiBold" }),
  fontBodyBold: Platform.select({ ios: "Nunito-Bold", default: "Nunito_700Bold" }),
  fontBodyBlack: Platform.select({ ios: "Nunito-ExtraBold", default: "Nunito_800ExtraBold" }),

  // Font sizes (Kumo scale: text-base is 14px)
  textXs: 12,
  textSm: 13,
  textBase: 14,
  textLg: 16,
  textXl: 20,
  text2xl: 24,
  text3xl: 30,
  text4xl: 36,
  text5xl: 48,

  // Line heights (multipliers)
  lineHeightXs: 1.33,
  lineHeightSm: 1.18,
  lineHeightBase: 1.5,
  lineHeightLg: 1.5,
  lineHeightXl: 1.4,
  lineHeight2xl: 1.33,

  // Letter spacing
  trackingTight: -0.5,
  trackingNormal: 0,
  trackingWide: 0.5,
  trackingWider: 1,
} as const;

// -----------------------------------------------------------------------------
// Spacing Tokens (8px baseline grid)
// -----------------------------------------------------------------------------

const spacing = {
  px: 1,
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const;

// -----------------------------------------------------------------------------
// Border Radius Tokens
// -----------------------------------------------------------------------------

const radii = {
  none: 0,
  sm: 4,
  DEFAULT: 10, // --radius: 0.625rem = 10px
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
} as const;

// -----------------------------------------------------------------------------
// Shadow Tokens
// -----------------------------------------------------------------------------

const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  // Paper Ledger signature shadow
  ledger: {
    shadowColor: "#1c1b1a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 4,
  },
  ledgerDark: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 4,
  },
} as const;

// -----------------------------------------------------------------------------
// Exported Design Tokens
// -----------------------------------------------------------------------------

export const designTokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
} as const;

// Export individual token categories for convenience
export { colors, typography, spacing, radii, shadows };
