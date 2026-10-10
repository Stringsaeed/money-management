import { StyleSheet } from "react-native";

import { colors, radius } from "../tokens";

export const KEY_HEIGHT = 64;
/** Smallest key in `fill` mode, so a short sheet never crushes the pad below a comfortable tap. */
export const KEY_MIN_HEIGHT = 48;

export const keyStyles = StyleSheet.create({
  cell: {
    flex: 1,
  },
  key: {
    alignItems: "center",
    borderRadius: radius.full,
    height: KEY_HEIGHT,
    justifyContent: "center",
  },
  /** Fill mode: keys take the row height and wear the surface fill and ring. */
  keyFill: {
    backgroundColor: colors.surface.default,
    borderColor: colors.keypad.ring,
    borderWidth: 1,
    flex: 1,
    height: undefined,
    minHeight: KEY_MIN_HEIGHT,
  },
  pressed: {
    backgroundColor: colors.fill.neutral,
  },
  label: {
    fontSize: 26,
    lineHeight: 32,
  },
});
