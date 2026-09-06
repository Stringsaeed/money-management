import type { TextStyle } from "react-native";

// border border-input rounded-[10px] p-3.5 text-base leading-5 text-foreground
/**
 * Vertical-metrics reset shared by every text input. Strips Android's extra
 * font padding and centers the glyphs so the input's explicit `leading-*`
 * renders identically on both platforms. Pair with a `leading-*` on className.
 */
export const inputTextStyle: TextStyle = {
  includeFontPadding: false,
  textAlignVertical: "center",
  fontFamily: "Nunito_500Medium",
  fontSize: 16,
  borderWidth: 1,
  minHeight: 56,
};
