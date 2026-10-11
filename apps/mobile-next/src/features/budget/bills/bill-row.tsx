import { Pressable, StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import type { EnvelopeLine } from "../home/home-model";

import type { BillStatus } from "./bills-model";

interface BillRowProps {
  readonly line: EnvelopeLine;
  readonly status: BillStatus;
  readonly onPress: () => void;
  readonly onCover: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

function statusText(status: BillStatus): string {
  switch (status.kind) {
    case "paid":
      return "Paid";
    case "ready":
      return "Ready";
    case "short":
      return `Short ${money(status.shortMinor)}`;
    case "unplanned":
      return "Not planned this period";
  }
}

/** One Bills envelope: paid, ready, or short, with Cover when it is short. */
export function BillRow({ line, status, onPress, onCover }: BillRowProps) {
  const { envelope, totals } = line;
  const short = status.kind === "short";
  const left = `${money(totals.leftMinor)} left`;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${envelope.name}, ${statusText(status)}, ${left}`}
        onPress={onPress}
        style={styles.top}
      >
        <View style={styles.text}>
          <Text variant="body" numberOfLines={1}>
            {envelope.name}
          </Text>
          <View style={styles.status}>
            {status.kind === "paid" ? <Icon name="check" size={16} color={colors.sage} /> : null}
            <Text variant="caption" style={short && styles.short}>
              {statusText(status)}
            </Text>
          </View>
        </View>
        <Text variant="label">{left}</Text>
      </Pressable>
      {short ? <Button title="Cover" variant="secondary" onPress={onCover} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  top: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  text: { flex: 1, gap: spacing[0.5] },
  status: { alignItems: "center", flexDirection: "row", gap: spacing[1] },
  short: { color: colors.terracotta },
});
