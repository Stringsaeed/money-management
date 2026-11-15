import type { ReactNode } from "react";
import { StyleSheet, Text as NativeText, View } from "react-native";

import {
  CategoryTile,
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  PressableScale,
  StatusPill,
  Text,
} from "@/ui/trove";

import type { PillCopy } from "./bills-copy";

interface PaymentRowProps {
  /** The envelope's Category emoji or a Trove category icon name. */
  readonly icon: string;
  readonly name: string;
  /** Mono caption, e.g. "DUE 18 OCT · ENVELOPE HAS 300". */
  readonly meta: string;
  /** Mono figure over the pill, e.g. "1,850.00" or "10,000 / 15,000". */
  readonly amount: string;
  readonly pill: PillCopy;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  /** Second line under the text (progress bar, Cover or Mark paid), indented past the tile. */
  readonly children?: ReactNode;
}

/** B1 row: round tile, name over a mono caption, and the figure over its status pill. */
export function PaymentRow({
  icon,
  name,
  meta,
  amount,
  pill,
  accessibilityLabel,
  onPress,
  children,
}: PaymentRowProps) {
  return (
    <View style={styles.row}>
      <PressableScale
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={onPress}
        pressedStyle={styles.pressed}
        scaleOnPress={false}
        style={styles.top}
      >
        <CategoryTile icon={icon} round />
        <View style={styles.copy}>
          <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
            {name}
          </Text>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            style={styles.meta}
          >
            {meta}
          </NativeText>
        </View>
        <View style={styles.trailing}>
          <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="amountMd">
            {amount}
          </Text>
          <StatusPill accessibilityLabel={pill.spoken} label={pill.label} status={pill.status} />
        </View>
      </PressableScale>
      {children ? <View style={styles.second}>{children}</View> : null}
    </View>
  );
}

/** Tile 40 + gap 12: the second line starts under the name. */
const TEXT_INSET = 52;

const styles = StyleSheet.create({
  row: {
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    gap: 8,
    paddingVertical: 12,
  },
  top: { alignItems: "center", flexDirection: "row", gap: 12 },
  pressed: { opacity: 0.7 },
  copy: { flex: 1, minWidth: 0 },
  meta: { color: colors.text.tertiary, fontFamily: fonts.mono, fontSize: 11, lineHeight: 15 },
  trailing: { alignItems: "flex-end", gap: 2 },
  second: { alignItems: "flex-start", marginLeft: TEXT_INSET },
});
