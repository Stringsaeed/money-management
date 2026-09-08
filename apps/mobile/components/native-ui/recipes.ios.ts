// oxlint-disable anti-slop/no-shape-in-symbol-names
import {
  background,
  fixedSize,
  font,
  foregroundStyle,
  opacity,
  padding,
  shapes as swiftUiShapes,
  strokeBorder,
} from "@expo/ui/swift-ui/modifiers";

import { fontFace, type AuthFontWeight, type AuthPalette } from "@/components/auth/ui/tokens";

import type { NativeControlRecipe } from "./recipe-types";
import {
  NATIVE_CONTROL_SPECS,
  resolveNativeColor,
  type NativeControlRole,
  type NativeControlSpec,
} from "./roles";
import { stretchHorizontal } from "./stretch.ios";

export type { NativeControlRecipe } from "./recipe-types";

function iosFill(role: NativeControlRole, palette: AuthPalette) {
  const spec: NativeControlSpec = NATIVE_CONTROL_SPECS[role];
  const fill = spec.fill;
  if (fill.kind === "none") return undefined;
  if (fill.kind === "solid") {
    return background(
      resolveNativeColor(fill.color, palette),
      swiftUiShapes.roundedRectangle({ cornerRadius: spec.radius }),
    );
  }
  return background(
    {
      type: "linearGradient",
      colors: [resolveNativeColor(fill.start, palette), resolveNativeColor(fill.end, palette)],
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
  role: NativeControlRole,
  palette: AuthPalette,
  disabled: boolean,
): NativeControlRecipe {
  const spec: NativeControlSpec = NATIVE_CONTROL_SPECS[role];
  const fill = iosFill(role, palette);
  const modifiers = [
    fixedSize({ horizontal: false }),
    font({
      family: fontFace(spec.label.weight),
      size: spec.label.size,
      weight: FONT_WEIGHT[spec.label.weight],
    }),
    foregroundStyle(resolveNativeColor(spec.label.color, palette)),
    ...stretchHorizontal(spec.height),
  ];
  if (spec.paddingVertical != null) {
    modifiers.push(padding({ vertical: spec.paddingVertical }));
  }
  if (fill) modifiers.push(fill);
  if (spec.ring) {
    modifiers.push(
      strokeBorder({
        color: resolveNativeColor(spec.ring.color, palette),
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
