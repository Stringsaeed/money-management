import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, spacing } from "@/ui/design-tokens";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

interface OverNoticeProps {
  /** How far below zero Safe to spend is, positive. */
  readonly overMinor: number;
  /** Cover money into the plan. Disabled until the Cover flow exists. */
  readonly onCover?: () => void;
  readonly onAdjust: () => void;
}

/** Safe to spend is at or below zero: say why, and offer the two ways out. */
export function OverNotice({ overMinor, onCover, onAdjust }: OverNoticeProps) {
  return (
    <Surface variant="recessed" style={styles.surface}>
      <Text variant="body" accessibilityRole="alert" style={styles.message}>
        {`You've planned or spent ${formatMoneyMinor(overMinor, BUDGET_CURRENCY)} more than you have`}
      </Text>
      <View style={styles.actions}>
        <Button title="Cover" variant="secondary" onPress={onCover} disabled={!onCover} />
        <Button title="Adjust" variant="secondary" onPress={onAdjust} />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: { gap: spacing[3] },
  message: { color: colors.terracotta },
  actions: { flexDirection: "row", gap: spacing[2] },
});
