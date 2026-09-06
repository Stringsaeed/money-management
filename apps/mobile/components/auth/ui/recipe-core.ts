import type { UniversalStyle, UniversalTextStyle } from "@expo/ui";

// UniversalStyle has no minHeight or italic. Field height is fixed so transformStyle
// can emit padding -> frame -> background -> border -> clip in the right order.

import {
  AUTH_CONTROL_SPECS,
  AUTH_FIELD_SPEC,
  AUTH_TEXT_SPECS,
  resolveColor,
  type AuthControlRole,
  type AuthControlSpec,
  type AuthTextRole,
  type AuthTextSpec,
} from "./roles";
import { fontFace, type AuthPalette } from "./tokens";

export function controlLabelStyle(role: AuthControlRole, palette: AuthPalette): UniversalTextStyle {
  const spec: AuthControlSpec = AUTH_CONTROL_SPECS[role];
  return {
    fontFamily: fontFace(spec.label.weight),
    fontSize: spec.label.size,
    color: resolveColor(spec.label.color, palette),
    lineHeight: spec.label.lineHeight,
    textAlign: "center",
  };
}

export function textStyleForRole(role: AuthTextRole, palette: AuthPalette): UniversalTextStyle {
  const spec: AuthTextSpec = AUTH_TEXT_SPECS[role];
  const style: UniversalTextStyle = {
    fontFamily: fontFace(spec.weight),
    fontSize: spec.size,
    color: resolveColor(spec.color, palette),
  };
  if (spec.lineHeight != null) style.lineHeight = spec.lineHeight;
  if (spec.letterSpacing != null) style.letterSpacing = spec.letterSpacing;
  if (spec.align) style.textAlign = spec.align;
  return style;
}

export function fieldBoxStyle(palette: AuthPalette): UniversalStyle {
  return {
    height: AUTH_FIELD_SPEC.height,
    borderRadius: AUTH_FIELD_SPEC.radius,
    borderWidth: AUTH_FIELD_SPEC.borderWidth,
    borderColor: resolveColor(AUTH_FIELD_SPEC.borderColor, palette),
    backgroundColor: resolveColor(AUTH_FIELD_SPEC.fill, palette),
    padding: AUTH_FIELD_SPEC.padding,
  };
}

export function fieldTextStyle(palette: AuthPalette): UniversalTextStyle {
  return {
    fontFamily: fontFace(AUTH_FIELD_SPEC.text.weight),
    fontSize: AUTH_FIELD_SPEC.text.size,
    color: resolveColor(AUTH_FIELD_SPEC.text.color, palette),
    lineHeight: AUTH_FIELD_SPEC.text.lineHeight,
  };
}

export function androidControlStyle(
  role: AuthControlRole,
  palette: AuthPalette,
  disabled: boolean,
): UniversalStyle {
  const spec: AuthControlSpec = AUTH_CONTROL_SPECS[role];
  const fill = spec.fill;
  let backgroundColor: string | undefined;
  if (fill.kind === "solid") {
    backgroundColor = resolveColor(fill.color, palette);
  }
  if (fill.kind === "kumo-gradient") {
    // Compose background() is a color only; primary CTA is solid emphasis-end.
    backgroundColor = resolveColor(fill.end, palette);
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
    style.borderColor = resolveColor(spec.ring.color, palette);
  }
  if (backgroundColor) style.backgroundColor = backgroundColor;
  return style;
}
