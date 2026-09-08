import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";

import { androidControlStyle, controlLabelStyle } from "./recipe-core";
import type { NativeControlRecipe } from "./recipe-types";
import type { NativeControlRole } from "./roles";
import type { AuthPalette } from "@/components/auth/ui/tokens";

export type { NativeControlRecipe } from "./recipe-types";

export function controlRecipe(
  role: NativeControlRole,
  palette: AuthPalette,
  disabled: boolean,
): NativeControlRecipe {
  return {
    control: {
      style: androidControlStyle(role, palette, disabled),
      modifiers: [fillMaxWidth()],
    },
    label: { textStyle: controlLabelStyle(role, palette) },
  };
}
