import { StyleSheet, View } from "react-native";

import { amountAccessibilityLabel, Amount, type SignDisplay } from "../amount";
import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, layout, space, type CategoryKey } from "../tokens";
import { CategoryTile } from "./category-tile";
import { PressableRow } from "./pressable-row";
import { joinSpoken } from "./utils";

export interface TransactionRowProps {
  title: string;
  /** e.g. "Groceries · 8:12 AM". */
  subtitle?: string;
  /** Integer minor units. Negative is spending; positive is money in. */
  minor: number;
  currency: string;
  /** Trove category icon name or emoji. */
  icon: string;
  /** Tinted tile for category screens; lists keep the neutral tile. */
  tint?: CategoryKey;
  /** `always` (default) prints `+` on money in. */
  signDisplay?: SignDisplay;
  onPress?: () => void;
  testID?: string;
}

const spokenAmount = (minor: number, currency: string, signDisplay: SignDisplay) => {
  const plus = signDisplay === "always" && minor > 0 ? "plus " : "";
  return `${plus}${amountAccessibilityLabel(minor, currency)}`;
};

/**
 * 64pt row: tile, title and subtitle, amount. Spending stays text.primary with a minus; money
 * in is `+` in positive.text. Cheap by design — long lists are the caller's job.
 */
export function TransactionRow({
  title,
  subtitle,
  minor,
  currency,
  icon,
  tint,
  signDisplay = "always",
  onPress,
  testID,
}: TransactionRowProps) {
  return (
    <PressableRow
      accessibilityLabel={joinSpoken([title, subtitle, spokenAmount(minor, currency, signDisplay)])}
      onPress={onPress}
      style={styles.row}
      testID={testID}
    >
      <CategoryTile icon={icon} tint={tint} />
      <View style={styles.text}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
          {title}
        </Text>
        {subtitle ? (
          <Text
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            tone="secondary"
            variant="bodySm"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Amount currency={currency} minor={minor} signDisplay={signDisplay} size="md" />
    </PressableRow>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    minHeight: layout.listRowMinHeight,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: space[2],
  },
  text: {
    flex: 1,
    gap: space[0.5],
    minWidth: 0,
  },
});
