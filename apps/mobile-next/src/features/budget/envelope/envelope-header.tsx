import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, layout } from "@/ui/trove";

import { RoundButton } from "./round-button";

interface EnvelopeHeaderProps {
  readonly title: string;
  /** The envelope's emoji, from its first mapped Category. */
  readonly emoji?: string;
  readonly onBack: () => void;
  /** Opens the ••• sheet; absent while the envelope is loading or missing. */
  readonly onMore?: () => void;
}

/** M4 header: 44pt back disc, the envelope's emoji and name, and the 44pt ••• disc. */
export function EnvelopeHeader({ title, emoji, onBack, onMore }: EnvelopeHeaderProps) {
  return (
    <View style={styles.row}>
      <RoundButton accessibilityLabel="Back to budget" icon="chevron-left" onPress={onBack} />
      <View style={styles.title}>
        {emoji ? (
          <NativeText
            accessibilityElementsHidden
            importantForAccessibility="no"
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={styles.emoji}
          >
            {emoji}
          </NativeText>
        ) : null}
        <NativeText
          accessibilityRole="header"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={styles.name}
        >
          {title}
        </NativeText>
      </View>
      {onMore ? (
        <RoundButton
          accessibilityLabel="More: change plan, group, rollover, categories, archive, history"
          icon="more"
          onPress={onMore}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: layout.screenGutter,
  },
  title: { alignItems: "center", flex: 1, flexDirection: "row", gap: 8, minWidth: 0 },
  emoji: { fontSize: 22, lineHeight: 28 },
  // Board h1: Nunito 800 22/28; no Text variant sits between titleMd (20) and titleLg (28).
  name: {
    color: colors.text.primary,
    flexShrink: 1,
    fontFamily: fonts.extrabold,
    fontSize: 22,
    lineHeight: 28,
  },
});
