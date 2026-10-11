import { Pressable, StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import { envelopeProgress, type EnvelopeLine } from "./home-model";

interface EverydayRowProps {
  readonly line: EnvelopeLine;
  readonly onPress: () => void;
}

/** One Everyday envelope: name, what is left (or how far over), and a progress bar. */
export function EverydayRow({ line, onPress }: EverydayRowProps) {
  const { envelope, totals } = line;
  const { fraction, over } = envelopeProgress(totals);
  const amount = formatMoneyMinor(Math.abs(totals.leftMinor), BUDGET_CURRENCY);
  const status = over ? `${amount} over` : `${amount} left`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${envelope.name}, ${status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <Text variant="body" style={styles.name} numberOfLines={1}>
          {envelope.name}
        </Text>
        <Text variant="label" style={over && styles.over}>
          {status}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            over && styles.fillOver,
            { width: `${Math.round(fraction * 100)}%` },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  pressed: { backgroundColor: colors.surfaceDim },
  top: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  name: { flex: 1 },
  over: { color: colors.terracotta },
  track: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    height: spacing[2],
    overflow: "hidden",
  },
  fill: { backgroundColor: colors.sage, borderRadius: radii.full, height: "100%" },
  fillOver: { backgroundColor: colors.terracotta },
});
