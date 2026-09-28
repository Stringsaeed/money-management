import type { ColorValue } from "react-native";

import { colors } from "@/ui/design-tokens";

/**
 * Home accent surfaces: the round action buttons (filter, "view all" arrows)
 * and the selected state of the chart-mode and period controls.
 *
 * Single source of truth so the home's emphasis can change in one place.
 */
export interface HomeAccent {
  readonly action: {
    readonly background: ColorValue;
    readonly border: ColorValue;
    readonly icon: ColorValue;
  };
  readonly selected: {
    readonly background: ColorValue;
    readonly border: ColorValue;
    readonly foreground: ColorValue;
  };
}

export const homeAccent: HomeAccent = {
  action: {
    background: colors.popover,
    border: colors.border,
    icon: colors.foreground,
  },
  selected: {
    background: colors.popover,
    border: colors.border,
    foreground: colors.foreground,
  },
};
