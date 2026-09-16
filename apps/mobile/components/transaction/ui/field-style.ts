import type { UniversalTextStyle } from "@expo/ui";
import { Platform } from "react-native";

import { colors, rawColorValues } from "@/lib/design-tokens";

export interface FieldBorderState {
  readonly focused: boolean;
  readonly error: boolean;
}

export function fieldBorderColor({ focused, error }: FieldBorderState) {
  if (focused) return colors.ink;
  if (error) return colors.destructive;
  return "transparent";
}

const BODY_MEDIUM_FACE = {
  ios: "Nunito-Medium",
  android: "Nunito_500Medium",
  web: "Nunito_500Medium",
} as const;

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
  return scheme === "dark" ? `${rawColorValues.dark.ink}40` : `${rawColorValues.light.ink}40`;
}
