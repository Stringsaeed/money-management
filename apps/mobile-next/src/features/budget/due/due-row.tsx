import { StyleSheet, View } from "react-native";

import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
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
    <View
      accessibilityLabel={`${item.name}, ${amount}. ${when}${muted ? ". Reminders muted" : ""}`}
      style={styles.row}
    >
      <View style={styles.top}>
        <Text variant="body" style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text variant="body">{amount}</Text>
      </View>
      <Text variant="caption" style={late && styles.late}>
        {muted ? `${when} · reminders muted` : when}
      </Text>
      <View style={styles.actions}>
        <Button title="Mark paid" onPress={onMarkPaid} style={styles.primary} />
        {onSnooze ? <Chip label="Snooze 1 day" onPress={onSnooze} /> : null}
        <Chip label="Skip this month" onPress={onSkip} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[1],
    padding: spacing[4],
  },
  top: { flexDirection: "row", gap: spacing[2], justifyContent: "space-between" },
  name: { flex: 1 },
  late: { color: colors.terracotta },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    paddingTop: spacing[2],
  },
  primary: { minHeight: spacing[10], paddingHorizontal: spacing[4] },
});
