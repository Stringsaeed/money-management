import { Text as NativeText, View } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE } from "../tokens";
import {
  layoutStyles,
  radioSubStyle,
  textStyles,
  type RadioCardSubTone,
} from "./radio-card-styles";

interface RadioCardMdBodyProps {
  title: string;
  sub?: string;
  emoji?: string;
  mono: boolean;
  subTone?: RadioCardSubTone;
  trailing?: string;
}

/** Source-row body: emoji, title over a sub line, and a mono figure on the right. */
export function RadioCardMdBody({
  title,
  sub,
  emoji,
  mono,
  subTone,
  trailing,
}: RadioCardMdBodyProps) {
  return (
    <>
      {emoji ? (
        <NativeText
          accessibilityElementsHidden
          importantForAccessibility="no"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={textStyles.emojiMd}
        >
          {emoji}
        </NativeText>
      ) : null}
      <View style={layoutStyles.texts}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} variant="labelMd">
          {title}
        </Text>
        {sub ? (
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={radioSubStyle(mono, subTone)}
          >
            {sub}
          </NativeText>
        ) : null}
      </View>
      {trailing ? (
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} variant="amountMd">
          {trailing}
        </Text>
      ) : null}
    </>
  );
}
