import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import {
  Amount,
  colors,
  layout,
  PressableScale,
  ProgressBar,
  radius,
  space,
  Text,
} from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { envelopeProgress, type EnvelopeLine } from "./home-model";

interface EverydayRowProps {
  readonly line: EnvelopeLine;
  readonly onPress: () => void;
  /** Quick add with this envelope already chosen. */
  readonly onLongPress?: () => void;
}

/** One Everyday envelope: name, what is left (or how far over), and a progress bar. */
export function EverydayRow({ line, onPress, onLongPress }: EverydayRowProps) {
  const { envelope, totals } = line;
  const { fraction, over } = envelopeProgress(totals);
  const amount = formatMoneyMinor(Math.abs(totals.leftMinor), BUDGET_CURRENCY);
  const status = over ? `${amount} over` : `${amount} left`;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${envelope.name}, ${status}`}
      accessibilityHint={onLongPress ? "Touch and hold to add spending" : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      pressedStyle={styles.pressed}
      scaleOnPress={false}
      style={styles.row}
    >
      <View style={styles.top}>
        <Text variant="labelMd" style={styles.name} numberOfLines={1}>
          {envelope.name}
        </Text>
        <View style={styles.status}>
          <Amount
            currency={BUDGET_CURRENCY}
            minor={Math.abs(totals.leftMinor)}
            size="sm"
            tone={over ? "negative" : "secondary"}
          />
          <Text tone={over ? "negative" : "secondary"} variant="labelSm">
            {over ? "over" : "left"}
          </Text>
        </View>
      </View>
      <ProgressBar fraction={fraction} tone={over ? "negative" : "accent"} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    gap: space[2],
    paddingHorizontal: layout.cardPadding,
    paddingVertical: space[3],
  },
  pressed: { backgroundColor: colors.fill.neutral },
  top: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    justifyContent: "space-between",
  },
  name: { flex: 1 },
  status: { alignItems: "baseline", flexDirection: "row", gap: space[1] },
});
