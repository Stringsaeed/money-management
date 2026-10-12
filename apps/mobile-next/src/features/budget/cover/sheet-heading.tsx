import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Text } from "@/ui/trove";

import { RoundButton } from "../envelope/round-button";

interface SheetHeadingProps {
  /** Mono caps line over the title, e.g. "BETWEEN ENVELOPES". */
  readonly stamp: string;
  readonly stampTone?: "tertiary" | "negative" | "warning";
  readonly title: string;
  readonly onClose: () => void;
}

/** Cover from… and Move money header: mono stamp over a 26pt title, and a 44pt close disc. */
export function SheetHeading({ stamp, stampTone = "tertiary", title, onClose }: SheetHeadingProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone={stampTone} variant="stamp">
          {stamp}
        </Text>
        <NativeText
          accessibilityRole="header"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={styles.title}
        >
          {title}
        </NativeText>
      </View>
      <RoundButton accessibilityLabel="Close" icon="close" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: 10 },
  titles: { flex: 1, gap: 2 },
  // Board h1: Nunito 800 26/32, -0.5 tracking; between titleLg (28) and titleMd (20).
  title: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
});
