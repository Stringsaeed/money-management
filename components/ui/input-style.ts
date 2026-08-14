import type { TextStyle } from "react-native";

/**
 * Vertical-metrics reset shared by every text input. Strips Android's extra
 * font padding and centers the glyphs so the input's explicit `leading-*`
 * renders identically on both platforms. Pair with a `leading-*` on className.
 */
export const inputTextStyle: TextStyle = {
  includeFontPadding: false,
  textAlignVertical: "center",
};
