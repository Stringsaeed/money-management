// oxlint-disable anti-slop/no-shape-in-symbol-names
import {
  background,
  frame,
  italic,
  opacity,
  padding,
  shapes as swiftUiShapes,
  strokeBorder,
} from "@expo/ui/swift-ui/modifiers";

import { controlLabelStyle, fieldBoxStyle, fieldTextStyle, textStyleForRole } from "./recipe-core";
import type { AuthControlRecipe, AuthRecipe } from "./recipe-types";
import {
  AUTH_CONTROL_SPECS,
  AUTH_TEXT_SPECS,
  resolveColor,
  type AuthControlRole,
  type AuthControlSpec,
  type AuthTextRole,
  type AuthTextSpec,
} from "./roles";
import type { AuthPalette } from "./tokens";

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

export function controlRecipe(
  role: AuthControlRole,
  palette: AuthPalette,
  disabled: boolean,
): AuthControlRecipe {
  const spec: AuthControlSpec = AUTH_CONTROL_SPECS[role];
  const fill = iosFill(role, palette);
  const modifiers = [
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
    label: { textStyle: controlLabelStyle(role, palette) },
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
  return {
    style: fieldBoxStyle(palette),
    textStyle: fieldTextStyle(palette),
    modifiers: [],
  };
}
