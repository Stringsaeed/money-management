import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button, Card, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

interface OverNoticeProps {
  /** How far below zero Safe to spend is, positive (the notice is only shown below zero). */
  readonly overMinor: number;
  /** Open the Cover flow for the envelope that is over. */
  readonly onCover?: () => void;
  readonly onAdjust: () => void;
}

/** Safe to spend is below zero: say why, and offer the two ways out. */
export function OverNotice({ overMinor, onCover, onAdjust }: OverNoticeProps) {
  return (
    <Card style={styles.card}>
      <Text accessibilityRole="alert" tone="negative">
        {`You've planned or spent ${formatMoneyMinor(overMinor, BUDGET_CURRENCY)} more than you have`}
      </Text>
      <View style={styles.actions}>
        {onCover ? <Button label="Cover" variant="secondary" onPress={onCover} /> : null}
        <Button label="Adjust" variant="secondary" onPress={onAdjust} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[3] },
  actions: { flexDirection: "row", gap: space[2] },
});
