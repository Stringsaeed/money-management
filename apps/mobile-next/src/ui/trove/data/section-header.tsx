import { StyleSheet, View } from "react-native";

import { Amount, type SignDisplay } from "../amount";
import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, space } from "../tokens";

export interface SectionHeaderProps {
  /** e.g. "Today", "Yesterday". */
  title: string;
  /** Day total in minor units. Omit for a title-only header. */
  totalMinor?: number;
  /** Required with `totalMinor`. */
  currency?: string;
  /** `always` (default) prints `+` on a positive day. */
  signDisplay?: SignDisplay;
}

/** Activity section header: day on the left, quiet day total on the right. */
export function SectionHeader({
  title,
  totalMinor,
  currency,
  signDisplay = "always",
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        variant="labelMd"
      >
        {title}
      </Text>
      {totalMinor !== undefined && currency ? (
        <Amount
          currency={currency}
          minor={totalMinor}
          signDisplay={signDisplay}
          size="sm"
          tone="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: space[3],
    justifyContent: "space-between",
    paddingHorizontal: space[1],
  },
});
