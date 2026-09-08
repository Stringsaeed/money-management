import {
  type AuthFontWeight,
  type AuthPalette,
  type AuthTokenName,
} from "@/components/auth/ui/tokens";

export type NativeControlRole = "primary" | "secondary" | "tertiary" | "destructive";

export type NativeColorRef = AuthTokenName | "kumoRing" | "destructiveRing" | "white";

export type NativeFill =
  | { readonly kind: "none" }
  | { readonly kind: "solid"; readonly color: NativeColorRef }
  | {
      readonly kind: "kumo-gradient";
      readonly start: NativeColorRef;
      readonly end: NativeColorRef;
    };

export interface NativeControlSpec {
  readonly height?: number;
  readonly paddingVertical?: number;
  readonly radius: number;
  readonly fill: NativeFill;
  readonly ring?: { readonly color: NativeColorRef; readonly width: 1 };
  readonly label: {
    readonly color: NativeColorRef;
    readonly weight: AuthFontWeight;
    readonly size: number;
    readonly lineHeight: number;
  };
  readonly disabledOpacity: 0.5;
}

export const NATIVE_CONTROL_SPECS = {
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
  destructive: {
    height: 40,
    radius: 8,
    fill: { kind: "solid", color: "--color-destructive" },
    ring: { color: "destructiveRing", width: 1 },
    label: { color: "white", weight: "600", size: 13, lineHeight: 21 },
    disabledOpacity: 0.5,
  },
} satisfies Readonly<Record<NativeControlRole, NativeControlSpec>>;

export function resolveNativeColor(ref: NativeColorRef, palette: AuthPalette): string {
  if (ref === "white") return "#ffffff";
  if (ref === "kumoRing") return palette.kumoRing;
  if (ref === "destructiveRing") {
    return palette.scheme === "dark" ? "#c90008" : "#da252e";
  }
  return palette[ref];
}

export type NativeSealedChrome = {
  readonly className?: never;
  readonly style?: never;
  readonly modifiers?: never;
};
