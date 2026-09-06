import type { TextInputProps } from "@expo/ui";

import {
  AUTH_PLACEHOLDER_COLOR,
  type AuthFontWeight,
  type AuthPalette,
  type AuthTokenName,
} from "./tokens";

export type AuthControlRole = "primary" | "secondary" | "tertiary";
export type AuthTextRole = "title" | "subtitle" | "note" | "notice-error" | "notice-success";
export type AuthFieldKind = "email" | "name" | "password";

export type AuthColorRef = AuthTokenName | "kumoRing" | "white";

export type AuthFill =
  | { readonly kind: "none" }
  | { readonly kind: "solid"; readonly color: AuthColorRef }
  | { readonly kind: "kumo-gradient"; readonly start: AuthColorRef; readonly end: AuthColorRef };

export interface AuthControlSpec {
  readonly height?: number;
  readonly paddingVertical?: number;
  readonly radius: number;
  readonly fill: AuthFill;
  readonly ring?: { readonly color: AuthColorRef; readonly width: 1 };
  readonly label: {
    readonly color: AuthColorRef;
    readonly weight: AuthFontWeight;
    readonly size: number;
    readonly lineHeight: number;
  };
  readonly disabledOpacity: 0.5;
}

export interface AuthTextSpec {
  readonly color: AuthColorRef;
  readonly weight: AuthFontWeight;
  readonly size: number;
  readonly lineHeight?: number;
  readonly letterSpacing?: number;
  readonly italic?: boolean;
  readonly align?: "left" | "center";
}

export interface AuthFieldSpec {
  readonly height: 56;
  readonly radius: 10;
  readonly padding: 14;
  readonly borderWidth: 1;
  readonly borderColor: AuthColorRef;
  readonly fill: AuthColorRef;
  readonly text: {
    readonly color: AuthColorRef;
    readonly weight: AuthFontWeight;
    readonly size: 16;
    readonly lineHeight: 20;
  };
  readonly placeholderColor: string;
}

export interface AuthFieldKindPreset {
  readonly secure: boolean;
  readonly autoCapitalize: "none" | "words";
  readonly autoComplete?: TextInputProps["autoComplete"];
  readonly keyboardType?: TextInputProps["keyboardType"];
}

export const AUTH_CONTROL_SPECS = {
  primary: {
    height: 40,
    radius: 8,
    fill: {
      kind: "kumo-gradient",
      start: "--color-kumo-brand-emphasis-start",
      end: "--color-kumo-brand-emphasis-end",
    },
    ring: { color: "kumoRing", width: 1 },
    label: { color: "white", weight: "600", size: 13, lineHeight: 21 },
    disabledOpacity: 0.5,
  },
  secondary: {
    height: 40,
    radius: 8,
    fill: { kind: "solid", color: "--color-background" },
    ring: { color: "--color-border", width: 1 },
    label: { color: "--color-foreground", weight: "500", size: 13, lineHeight: 21 },
    disabledOpacity: 0.5,
  },
  tertiary: {
    paddingVertical: 8,
    radius: 0,
    fill: { kind: "none" },
    label: { color: "--color-muted-foreground", weight: "400", size: 13, lineHeight: 21 },
    disabledOpacity: 0.5,
  },
} satisfies Readonly<Record<AuthControlRole, AuthControlSpec>>;

export const AUTH_TEXT_SPECS = {
  title: { color: "--color-ink", weight: "500", size: 36, letterSpacing: -0.9, italic: true },
  subtitle: { color: "--color-muted-foreground", weight: "400", size: 14 },
  note: { color: "--color-muted-foreground", weight: "400", size: 13 },
  "notice-error": { color: "--color-destructive", weight: "400", size: 13 },
  "notice-success": { color: "--color-sage", weight: "500", size: 13 },
} satisfies Readonly<Record<AuthTextRole, AuthTextSpec>>;

export const AUTH_FIELD_SPEC: AuthFieldSpec = {
  height: 56,
  radius: 10,
  padding: 14,
  borderWidth: 1,
  borderColor: "--color-input",
  fill: "--color-surface",
  text: { color: "--color-foreground", weight: "500", size: 16, lineHeight: 20 },
  placeholderColor: AUTH_PLACEHOLDER_COLOR,
};

export const AUTH_FIELD_KINDS = {
  email: {
    secure: false,
    autoCapitalize: "none",
    autoComplete: "email",
    keyboardType: "email-address",
  },
  name: { secure: false, autoCapitalize: "words" },
  password: { secure: true, autoCapitalize: "none" },
} satisfies Readonly<Record<AuthFieldKind, AuthFieldKindPreset>>;

export const AUTH_SHELL_SPEC = { headerSpacing: 8, bodySpacing: 12, bodyTopPadding: 32 } as const;

export function resolveColor(ref: AuthColorRef, palette: AuthPalette): string {
  if (ref === "white") return "#ffffff";
  if (ref === "kumoRing") return palette.kumoRing;
  return palette[ref];
}

export type AuthSealedChrome = {
  readonly className?: never;
  readonly style?: never;
  readonly modifiers?: never;
};
