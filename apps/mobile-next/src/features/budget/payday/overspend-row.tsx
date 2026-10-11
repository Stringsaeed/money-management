import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
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
    <View style={styles.row}>
      <Text variant="body">{`${item.name} was ${over} over`}</Text>
      {resolution === "covered" ? (
        <Text variant="caption">Covered from other money this month.</Text>
      ) : resolution === "accepted" ? (
        <Text variant="caption">Accepted. It already came out of your money to plan.</Text>
      ) : (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button title="Cover now" variant="secondary" onPress={onCover} />
          </View>
          <View style={styles.action}>
            <Button title="Accept" variant="ghost" onPress={onAccept} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderColor: colors.terracotta,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
    padding: spacing[4],
  },
  actions: { flexDirection: "row", gap: spacing[2] },
  action: { flex: 1 },
});
