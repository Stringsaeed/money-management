// oxlint-disable anti-slop/no-shape-in-symbol-names
import {
  background,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  italic,
  opacity,
  padding,
  shapes as swiftUiShapes,
  strokeBorder,
  textFieldStyle,
} from "@expo/ui/swift-ui/modifiers";

import { fieldTextStyle, textStyleForRole } from "./recipe-core";
import type { AuthControlRecipe, AuthRecipe } from "./recipe-types";
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
import { fontFace, type AuthFontWeight, type AuthPalette } from "./tokens";

export type { AuthControlRecipe, AuthRecipe } from "./recipe-types";

function iosFill(role: AuthControlRole, palette: AuthPalette) {
  const spec: AuthControlSpec = AUTH_CONTROL_SPECS[role];
  const fill = spec.fill;
  if (fill.kind === "none") return undefined;
  if (fill.kind === "solid") {
    return background(
      resolveColor(fill.color, palette),
      swiftUiShapes.roundedRectangle({ cornerRadius: spec.radius }),
    );
  }
  return background(
    {
      type: "linearGradient",
      colors: [resolveColor(fill.start, palette), resolveColor(fill.end, palette)],
      startPoint: { x: 0.5, y: 0 },
      endPoint: { x: 0.5, y: 1 },
    },
    swiftUiShapes.roundedRectangle({ cornerRadius: spec.radius }),
  );
}

const FONT_WEIGHT = {
  "400": "regular",
  "500": "medium",
  "600": "semibold",
} as const satisfies Record<AuthFontWeight, "regular" | "medium" | "semibold">;

export function controlRecipe(
  role: AuthControlRole,
  palette: AuthPalette,
  disabled: boolean,
): AuthControlRecipe {
  const spec: AuthControlSpec = AUTH_CONTROL_SPECS[role];
  const fill = iosFill(role, palette);
  // Innermost first: expand before paint so the shape fills the offered width.
  // Label typography lives on the button (string `label`); a Text child hugs width.
  const modifiers = [
    fixedSize({ horizontal: false }),
    font({
      family: fontFace(spec.label.weight),
      size: spec.label.size,
      weight: FONT_WEIGHT[spec.label.weight],
    }),
    foregroundStyle(resolveColor(spec.label.color, palette)),
    spec.height != null
      ? frame({ maxWidth: Infinity, height: spec.height })
      : frame({ maxWidth: Infinity }),
  ];
  if (spec.paddingVertical != null) {
    modifiers.push(padding({ vertical: spec.paddingVertical }));
  }
  if (fill) modifiers.push(fill);
  if (spec.ring) {
    modifiers.push(
      strokeBorder({
        color: resolveColor(spec.ring.color, palette),
        shape: "roundedRectangle",
        cornerRadius: spec.radius,
        style: { lineWidth: spec.ring.width },
      }),
    );
  }
  modifiers.push(opacity(disabled ? spec.disabledOpacity : 1));
  return {
    control: { modifiers },
    label: {},
  };
}

export function textRecipe(role: AuthTextRole, palette: AuthPalette): AuthRecipe {
  const spec: AuthTextSpec = AUTH_TEXT_SPECS[role];
  return {
    textStyle: textStyleForRole(role, palette),
    modifiers: spec.italic ? [italic()] : [],
  };
}

export function fieldRecipe(palette: AuthPalette): AuthRecipe {
  const spec = AUTH_FIELD_SPEC;
  // Avoid UniversalStyle borderRadius+border: transformStyle uses border() then
  // clipShape, which shears the stroke corners. Paint with shape + strokeBorder.
  return {
    textStyle: fieldTextStyle(palette),
    modifiers: [
      textFieldStyle("plain"),
      padding({ all: spec.padding }),
      frame({ maxWidth: Infinity, height: spec.height }),
      background(
        resolveColor(spec.fill, palette),
        swiftUiShapes.roundedRectangle({ cornerRadius: spec.radius }),
      ),
      strokeBorder({
        color: resolveColor(spec.borderColor, palette),
        shape: "roundedRectangle",
        cornerRadius: spec.radius,
        style: { lineWidth: spec.borderWidth },
      }),
    ],
  };
}
