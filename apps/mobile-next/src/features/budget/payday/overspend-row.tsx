import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button, Card, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { Overspend } from "./wrap-up-model";

export type OverspendResolution = "covered" | "accepted";

interface OverspendRowProps {
  readonly item: Overspend;
  readonly resolution: OverspendResolution | undefined;
  readonly onCover: () => void;
  readonly onAccept: () => void;
}

/** An envelope that ended last month below zero: cover it this month, or accept it. */
export function OverspendRow({ item, resolution, onCover, onAccept }: OverspendRowProps) {
  const over = formatMoneyMinor(item.overMinor, BUDGET_CURRENCY);
  return (
    <Card style={styles.card}>
      <Text tone="negative">{`${item.name} was ${over} over`}</Text>
      {resolution === "covered" ? (
        <Text tone="secondary" variant="bodySm">
          Paid back into Not planned yet from your envelopes.
        </Text>
      ) : resolution === "accepted" ? (
        <Text tone="secondary" variant="bodySm">
          Accepted. It already came out of your money to plan.
        </Text>
      ) : (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button fullWidth label="Cover now" variant="secondary" onPress={onCover} />
          </View>
          <View style={styles.action}>
            <Button fullWidth label="Accept" variant="tertiary" onPress={onAccept} />
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[2] },
  actions: { flexDirection: "row", gap: space[2] },
  action: { flex: 1 },
});
