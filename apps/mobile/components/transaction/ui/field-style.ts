import type { UniversalTextStyle } from "@expo/ui";
import { Platform } from "react-native";

export interface FieldBorderState {
  readonly focused: boolean;
  readonly error: boolean;
}

/**
 * Border-color contract for Paper Ledger text fields: focus wins over an
 * invalid state (you're actively fixing it), otherwise a destructive border
 * flags the error, and an idle valid field stays borderless.
 */
export function fieldBorderClassName({ focused, error }: FieldBorderState): string {
  if (focused) return "border-ink";
  if (error) return "border-destructive";
  return "border-transparent";
}

/** Platform PostScript / loaded-face names for body medium (matches auth tokens). */
const BODY_MEDIUM_FACE = {
  ios: "Nunito-Medium",
  android: "Nunito_500Medium",
  web: "Nunito_500Medium",
} as const;

/**
 * Typography passed into `@expo/ui` `TextInput` — Host cannot take NativeWind
 * classNames, so ink color + Nunito body medium land via `textStyle`.
 */
export function fieldTextStyle(ink: string): UniversalTextStyle {
  return {
    fontFamily:
      Platform.select({
        ios: BODY_MEDIUM_FACE.ios,
        android: BODY_MEDIUM_FACE.android,
        default: BODY_MEDIUM_FACE.web,
      }) ?? BODY_MEDIUM_FACE.web,
    fontSize: 15,
    lineHeight: 20,
    color: ink,
  };
}

export function fieldPlaceholderColor(scheme: string | null | undefined): string {
  return scheme === "dark" ? "#E8E6E340" : "#1C1B1A40";
}
