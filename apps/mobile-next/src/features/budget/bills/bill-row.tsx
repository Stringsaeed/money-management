import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Amount, Button, Card, colors, Icon, PressableScale, space, Text } from "@/ui/trove";
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
    <Card style={styles.card}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${envelope.name}, ${statusText(status)}, ${left}`}
        onPress={onPress}
        scaleOnPress={false}
        style={styles.top}
      >
        <View style={styles.text}>
          <Text variant="labelMd" numberOfLines={1}>
            {envelope.name}
          </Text>
          <View style={styles.status}>
            {status.kind === "paid" ? (
              <Icon name="check" size={16} color={colors.positive.text} />
            ) : null}
            <Text tone={short ? "negative" : "secondary"} variant="bodySm">
              {statusText(status)}
            </Text>
          </View>
        </View>
        <View style={styles.left}>
          <Amount currency={BUDGET_CURRENCY} minor={totals.leftMinor} size="sm" />
          <Text tone="secondary" variant="labelSm">
            left
          </Text>
        </View>
      </PressableScale>
      {short ? <Button fullWidth label="Cover" variant="secondary" onPress={onCover} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[3] },
  top: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    justifyContent: "space-between",
  },
  text: { flex: 1, gap: space[0.5] },
  status: { alignItems: "center", flexDirection: "row", gap: space[1] },
  left: { alignItems: "baseline", flexDirection: "row", gap: space[1] },
});
