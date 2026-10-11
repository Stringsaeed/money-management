import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button, Card, space, Text } from "@/ui/trove";
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
    <Card style={styles.card}>
      <Text accessibilityRole="alert" tone="negative">
        {`You've planned or spent ${formatMoneyMinor(overMinor, BUDGET_CURRENCY)} more than you have`}
      </Text>
      <View style={styles.actions}>
        <Button label="Cover" variant="secondary" onPress={onCover} disabled={!onCover} />
        <Button label="Adjust" variant="secondary" onPress={onAdjust} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[3] },
  actions: { flexDirection: "row", gap: space[2] },
});
