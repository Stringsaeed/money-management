import { StyleSheet, Text as NativeText, View } from "react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { colors, DENSE_MAX_FONT_SCALE, fonts, PressableScale, Text } from "@/ui/trove";

import type { SpendingRowDisplay } from "./spending-display";

interface SpendingRowProps {
  readonly transaction: V2Transaction;
  readonly display: SpendingRowDisplay;
  readonly onPress: (transaction: V2Transaction) => void;
}

/** One expense in the envelope: title over its mono stamp, the figure on the right, a rule under. */
export function SpendingRow({ transaction, display, onPress }: SpendingRowProps) {
  const { title, meta, figure, amountLabel } = display;
  return (
    <PressableScale
      accessibilityLabel={[title, meta.toLowerCase(), amountLabel].join(", ")}
      accessibilityRole="button"
      onPress={() => onPress(transaction)}
      pressedStyle={styles.pressed}
      scaleOnPress={false}
      style={styles.row}
    >
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
          {title}
        </Text>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={styles.meta}
        >
          {meta}
        </NativeText>
      </View>
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} variant="amountMd">
        {figure}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
  },
  pressed: { opacity: 0.7 },
  copy: { flex: 1, minWidth: 0 },
  meta: { color: colors.text.tertiary, fontFamily: fonts.mono, fontSize: 11, lineHeight: 15 },
});
