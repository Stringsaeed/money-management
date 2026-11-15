import { StyleSheet, Text as NativeText } from "react-native";

import { Icon } from "../icon";
import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";

export interface SheetLinkContentProps {
  emoji: string;
  label: string;
  meta?: string;
}

/** Emoji, Nunito 700 16 label, optional tertiary meta, and a 14pt chevron. */
export function SheetLinkContent({ emoji, label, meta }: SheetLinkContentProps) {
  return (
    <>
      <NativeText
        accessibilityElementsHidden
        importantForAccessibility="no"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.emoji}
      >
        {emoji}
      </NativeText>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </NativeText>
      {meta ? (
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={styles.meta}
        >
          {meta}
        </NativeText>
      ) : null}
      <Icon color={colors.text.tertiary} name="chevron-right" size={14} strokeWidth={2} />
    </>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 18, lineHeight: 24 },
  label: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 21,
  },
  meta: {
    color: colors.text.tertiary,
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
