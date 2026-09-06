import {
  androidControlStyle,
  controlLabelStyle,
  fieldBoxStyle,
  fieldTextStyle,
  textStyleForRole,
} from "./recipe-core";
import type { AuthControlRecipe, AuthRecipe } from "./recipe-types";
import type { AuthControlRole, AuthTextRole } from "./roles";
import type { AuthPalette } from "./tokens";

export type { AuthControlRecipe, AuthRecipe } from "./recipe-types";

export function controlRecipe(
  role: AuthControlRole,
  palette: AuthPalette,
  disabled: boolean,
): AuthControlRecipe {
  return {
    control: { style: androidControlStyle(role, palette, disabled) },
    label: { textStyle: controlLabelStyle(role, palette) },
  };
}

export function textRecipe(role: AuthTextRole, palette: AuthPalette): AuthRecipe {
  return { textStyle: textStyleForRole(role, palette) };
}

export function fieldRecipe(palette: AuthPalette): AuthRecipe {
  return {
    style: fieldBoxStyle(palette),
    textStyle: fieldTextStyle(palette),
  };
}
