import type { ReactNode } from "react";
import { Text as NativeText, View } from "react-native";

import { DENSE_MAX_FONT_SCALE } from "../tokens";
import {
  layoutStyles,
  subToneStyles,
  textStyles,
  type RadioCardSubTone,
} from "./radio-card-styles";

interface RadioCardLgBodyProps {
  title: string;
  sub?: string;
  emoji?: string;
  subTone?: RadioCardSubTone;
  children?: ReactNode;
}

/** Choice-card body: emoji inline with the title, a sentence, then any extra control. */
export function RadioCardLgBody({ title, sub, emoji, subTone, children }: RadioCardLgBodyProps) {
  return (
    <View style={layoutStyles.textsLg}>
      <View style={layoutStyles.titleRow}>
        {emoji ? (
          <NativeText
            accessibilityElementsHidden
            importantForAccessibility="no"
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={textStyles.emojiLg}
          >
            {emoji}
          </NativeText>
        ) : null}
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={textStyles.titleLg}>
          {title}
        </NativeText>
      </View>
      {sub ? (
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[textStyles.subLg, subToneStyles[subTone ?? "secondary"]]}
        >
          {sub}
        </NativeText>
      ) : null}
      {children ? <View style={layoutStyles.slot}>{children}</View> : null}
    </View>
  );
}
