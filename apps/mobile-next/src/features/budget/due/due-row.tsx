import { StyleSheet, View } from "react-native";

import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import { Amount, Button, Card, Chip, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { dueDateLabel } from "./due-date-label";

interface DueRowProps {
  readonly item: V2DueOccurrence;
  readonly late: boolean;
  readonly muted: boolean;
  readonly onMarkPaid: () => void;
  /** Only offered for bills due today or already overdue. */
  readonly onSnooze?: () => void;
  readonly onSkip: () => void;
}

/** One pending bill with its three actions. Nothing is recorded until Mark paid. */
export function DueRow({ item, late, muted, onMarkPaid, onSnooze, onSkip }: DueRowProps) {
  const amount = formatMoneyMinor(item.amountMinor, item.currency);
  const when = `${late ? "Was due" : "Due"} ${dueDateLabel(item.scheduledDate)}`;
  return (
    <Card
      accessibilityLabel={`${item.name}, ${amount}. ${when}${muted ? ". Reminders muted" : ""}`}
      style={styles.card}
    >
      <View style={styles.top}>
        <Text variant="labelMd" style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Amount currency={item.currency} minor={item.amountMinor} />
      </View>
      <Text tone={late ? "negative" : "secondary"} variant="bodySm">
        {muted ? `${when} · reminders muted` : when}
      </Text>
      <View style={styles.actions}>
        <Button label="Mark paid" onPress={onMarkPaid} size="sm" />
        {onSnooze ? <Chip label="Snooze 1 day" onPress={onSnooze} /> : null}
        <Chip label="Skip this month" onPress={onSkip} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[1] },
  top: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[2],
    justifyContent: "space-between",
  },
  name: { flex: 1 },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
    paddingTop: space[2],
  },
});
