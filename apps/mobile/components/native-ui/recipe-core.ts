import type { UniversalStyle, UniversalTextStyle } from "@expo/ui";

import { fontFace, type AuthPalette } from "@/components/auth/ui/tokens";

import {
  NATIVE_CONTROL_SPECS,
  resolveNativeColor,
  type NativeControlRole,
  type NativeControlSpec,
} from "./roles";

export function controlLabelStyle(
  role: NativeControlRole,
  palette: AuthPalette,
): UniversalTextStyle {
  const spec: NativeControlSpec = NATIVE_CONTROL_SPECS[role];
  return {
    fontFamily: fontFace(spec.label.weight),
    fontSize: spec.label.size,
    color: resolveNativeColor(spec.label.color, palette),
    lineHeight: spec.label.lineHeight,
    textAlign: "center",
  };
}

export function androidControlStyle(
  role: NativeControlRole,
  palette: AuthPalette,
  disabled: boolean,
): UniversalStyle {
  const spec: NativeControlSpec = NATIVE_CONTROL_SPECS[role];
  const fill = spec.fill;
  let backgroundColor: string | undefined;
  if (fill.kind === "solid") {
    backgroundColor = resolveNativeColor(fill.color, palette);
  }
  if (fill.kind === "kumo-gradient") {
    backgroundColor = resolveNativeColor(fill.end, palette);
  }
  const style: UniversalStyle = {
    borderRadius: spec.radius,
    opacity: disabled ? spec.disabledOpacity : 1,
  };
  if (spec.height != null) {
    style.height = spec.height;
  } else if (spec.paddingVertical != null) {
    style.paddingVertical = spec.paddingVertical;
  }
  if (spec.ring) {
    style.borderWidth = spec.ring.width;
    style.borderColor = resolveNativeColor(spec.ring.color, palette);
  }
  if (backgroundColor) style.backgroundColor = backgroundColor;
  return style;
}
