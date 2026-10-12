/* oxlint-disable @react-native/platform-colors -- dynamicColor wraps platform APIs with variables intentionally */

import { DynamicColorIOS, Platform, PlatformColor, type ColorValue } from "react-native";

import rawColors from "./colors.json";

/**
 * Trove semantic colors (design system v0.2 · Receipt).
 *
 * `colors.json` is the single source of truth: this module and
 * `plugins/withAndroidThemeColor.js` both read it. Every token is a light/dark pair that
 * resolves natively — DynamicColorIOS on iOS, day/night color resources on Android — so
 * switching modes repaints without a React re-render. Components read these semantic
 * tokens only, never the raw palette.
 */

export type ColorMode = "light" | "dark";
export type RawColorKey = keyof typeof rawColors.light;

/** Canonical hex pairs, for native props that reject opaque dynamic colors. */
export const troveRawColors: Readonly<Record<ColorMode, Readonly<Record<RawColorKey, string>>>> =
  rawColors;

/** Android resource name for a token, e.g. `bgCanvas` → `trove_bg_canvas`. */
export function androidColorName(key: string): string {
  return `trove_${key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}`;
}

/** Resolves a raw token key to a native light/dark color. */
export function colorToken(key: RawColorKey): ColorValue {
  const light = rawColors.light[key];
  const dark = rawColors.dark[key];
  if (Platform.OS === "ios") return DynamicColorIOS({ light, dark });
  if (Platform.OS === "android") return PlatformColor(`@color/${androidColorName(key)}`);
  return light;
}

export const colors = {
  bg: { canvas: colorToken("bgCanvas"), subtle: colorToken("bgSubtle") },
  surface: {
    default: colorToken("surfaceDefault"),
    raised: colorToken("surfaceRaised"),
    paper: colorToken("surfacePaper"),
  },
  border: {
    subtle: colorToken("borderSubtle"),
    default: colorToken("borderDefault"),
    strong: colorToken("borderStrong"),
  },
  text: {
    primary: colorToken("textPrimary"),
    secondary: colorToken("textSecondary"),
    tertiary: colorToken("textTertiary"),
    onPaper: colorToken("textOnPaper"),
    disabled: colorToken("textDisabled"),
    /** Unfilled digits of an amount being typed (e.g. the ".00" of "0.00"). */
    faded: colorToken("textFaded"),
  },
  fill: {
    /** Secondary buttons, icon buttons, pressed keys. */
    neutral: colorToken("fillNeutral"),
    disabled: colorToken("fillDisabled"),
    /** The selected segment. */
    selected: colorToken("fillSelected"),
  },
  /** Lime in dark, ink on paper: fill and label swap between modes. */
  accent: {
    fill: colorToken("accentFill"),
    on: colorToken("accentOn"),
    pressed: colorToken("accentPressed"),
    subtle: colorToken("accentSubtle"),
    text: colorToken("accentText"),
  },
  /** Marker behind ink text — totals. Always lime. */
  highlight: colorToken("highlight"),
  /** Status colors are for money only. */
  positive: { text: colorToken("positiveText"), subtle: colorToken("positiveSubtle") },
  negative: {
    text: colorToken("negativeText"),
    subtle: colorToken("negativeSubtle"),
    /** Label on a solid negative.text fill — destructive confirm button only. */
    on: colorToken("negativeOn"),
  },
  warning: {
    text: colorToken("warningText"),
    subtle: colorToken("warningSubtle"),
    bar: colorToken("warningBar"),
  },
  scrim: colorToken("scrim"),
  /** Light lifts with shadow; dark lifts with a lighter surface and a ring. */
  elevation: {
    ring1: colorToken("elevationRing1"),
    ring2: colorToken("elevationRing2"),
    shadow1: colorToken("shadow1"),
    shadow2: colorToken("shadow2"),
    shadow3: colorToken("shadow3"),
  },
  chart: {
    axis: colorToken("chartAxis"),
    spark: colorToken("chartSpark"),
    /** Past periods; the current one takes accent.fill. */
    bar: colorToken("chartBar"),
    tooltipFill: colorToken("chartTooltipFill"),
    tooltipText: colorToken("chartTooltipText"),
  },
  /** Number pad keys: ring around each key. */
  keypad: { ring: colorToken("keyRing") },
  /** Currency glyph beside an amount being typed: secondary ink on paper, lime on dark. */
  entry: { glyph: colorToken("entryGlyph") },
  /** Inverted toast: ink on paper mode, paper on dark mode. */
  toast: {
    fill: colorToken("toastFill"),
    text: colorToken("toastText"),
    tile: colorToken("toastTile"),
    action: colorToken("toastAction"),
  },
  /** Dotted leaders printed on receipts (always on paper). */
  receipt: { leader: colorToken("receiptLeader") },
  /**
   * Ink printed on a paper slip (`surface.paper`). The slip stays light in both modes, so these
   * hold the paper-mode values in dark mode too.
   */
  paper: {
    ink: colorToken("paperInk"),
    textSecondary: colorToken("paperTextSecondary"),
    textTertiary: colorToken("paperTextTertiary"),
    accentText: colorToken("paperAccentText"),
    negative: colorToken("paperNegative"),
    rule: colorToken("paperRule"),
    ruleStrong: colorToken("paperRuleStrong"),
    /** Paper lifts with a soft shadow on canvas; none on dark. */
    shadow: colorToken("paperShadow"),
  },
  /** Spending series on Home's income vs spending card: the same warm grey in both modes. */
  chartSpend: colorToken("chartSpend"),
  /** Selected segment of a compact toggle: paper white, or a lifted ring tone on dark. */
  segmentOn: colorToken("segmentOn"),
  /** Label on a solid warning.text fill, e.g. the due-count badge. */
  warningOn: colorToken("warningOn"),
  tabBar: {
    fill: colorToken("tabBarFill"),
    ring: colorToken("tabBarRing"),
    shadow: colorToken("tabBarShadow"),
    activeFill: colorToken("tabActiveFill"),
    activeIcon: colorToken("tabActiveIcon"),
    idleIcon: colorToken("tabIdleIcon"),
    /** iOS Liquid Glass bar only: the soft lift under the glass. */
    glassShadow: colorToken("tabBarGlassShadow"),
  },
} as const;
