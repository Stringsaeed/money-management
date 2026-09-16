export type AuthTokenName =
  | "--color-ink"
  | "--color-foreground"
  | "--color-background"
  | "--color-surface"
  | "--color-input"
  | "--color-border"
  | "--color-muted-foreground"
  | "--color-sage"
  | "--color-destructive"
  | "--color-kumo-brand-emphasis-start"
  | "--color-kumo-brand-emphasis-end";

export const AUTH_TOKEN_NAMES: readonly AuthTokenName[] = [
  "--color-ink",
  "--color-foreground",
  "--color-background",
  "--color-surface",
  "--color-input",
  "--color-border",
  "--color-muted-foreground",
  "--color-sage",
  "--color-destructive",
  "--color-kumo-brand-emphasis-start",
  "--color-kumo-brand-emphasis-end",
];

export type AuthPalette = Readonly<Record<AuthTokenName, string>> & {
  readonly kumoRing: string;
  readonly scheme: "light" | "dark";
};

export const AUTH_FALLBACK_PALETTE = {
  light: {
    "--color-ink": "#2c5f47",
    "--color-foreground": "#2c5f47",
    "--color-background": "#f5f5f0",
    "--color-surface": "#f5f5f0",
    "--color-input": "#cfddd2",
    "--color-border": "#cfddd2",
    "--color-muted-foreground": "#6e8a7c",
    "--color-sage": "#4a8f69",
    "--color-destructive": "#c4452f",
    "--color-kumo-brand-emphasis-start": "#619eff",
    "--color-kumo-brand-emphasis-end": "#2f6cf6",
    kumoRing: "#045ede",
    scheme: "light",
  },
  dark: {
    "--color-ink": "#d6e8dc",
    "--color-foreground": "#d6e8dc",
    "--color-background": "#0f1a14",
    "--color-surface": "#0f1a14",
    "--color-input": "#2a3a31",
    "--color-border": "#2a3a31",
    "--color-muted-foreground": "#8fae9d",
    "--color-sage": "#6fb58a",
    "--color-destructive": "#e0644e",
    "--color-kumo-brand-emphasis-start": "#5491f6",
    "--color-kumo-brand-emphasis-end": "#2a61dd",
    kumoRing: "#004dcc",
    scheme: "dark",
  },
} satisfies Record<"light" | "dark", AuthPalette>;

import { Platform } from "react-native";

export type AuthFontWeight = "400" | "500" | "600";

export const AUTH_FONT_FACES = {
  "400": { ios: "Nunito-Regular", android: "Nunito_400Regular" },
  "500": { ios: "Nunito-Medium", android: "Nunito_500Medium" },
  "600": { ios: "Nunito-SemiBold", android: "Nunito_600SemiBold" },
} satisfies Record<AuthFontWeight, { readonly ios: string; readonly android: string }>;

export function fontFace(weight: AuthFontWeight): string {
  const faces = AUTH_FONT_FACES[weight];
  return Platform.OS === "ios" ? faces.ios : faces.android;
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR = /^rgba?\(/i;
const NAMED_COLOR = /^[a-zA-Z]+$/;

export function normalizeColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (HEX_COLOR.test(trimmed) || RGB_COLOR.test(trimmed) || NAMED_COLOR.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

export const AUTH_PLACEHOLDER_COLOR = "#9a9896";
