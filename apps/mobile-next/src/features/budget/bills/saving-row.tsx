import { format, parseISO } from "date-fns";
import { Pressable, StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import { REPEAT_LABELS } from "./big-payment-model";
import type { SavingRow as SavingRowData, SavingWarning } from "./bills-model";

interface SavingRowProps {
  readonly row: SavingRowData;
  readonly onPress: () => void;
  readonly onMarkPaid: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

const warningText = (warning: SavingWarning): string =>
  warning.kind === "short_before_payday"
    ? `Short ${money(warning.shortMinor)}: due before you're paid`
    : "Not planned: nothing is going into this one this payday";

function dueText(row: SavingRowData): string | null {
  const { dueDate, repeat } = row.line.envelope;
  if (dueDate === null) return null;
  const date = `Due ${format(parseISO(dueDate), "d MMM yyyy")}`;
  return repeat && repeat !== "once" ? `${date} · ${REPEAT_LABELS[repeat].toLowerCase()}` : date;
}

/** One Saving-for envelope: progress to the target, the due date, and what to set aside. */
export function SavingRow({ row, onPress, onMarkPaid }: SavingRowProps) {
  const { envelope } = row.line;
  const due = dueText(row);
  const progress =
    row.targetMinor === null
      ? `${money(row.setAsideMinor)} set aside`
      : `${money(row.setAsideMinor)} of ${money(row.targetMinor)} set aside`;
  const perPayday = envelope.savingPerPaydayMinor;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[envelope.name, due, progress].filter(Boolean).join(", ")}
        onPress={onPress}
        style={styles.details}
      >
        <View style={styles.top}>
          <Text variant="body" style={styles.name} numberOfLines={1}>
            {envelope.name}
          </Text>
          {due ? <Text variant="caption">{due}</Text> : null}
        </View>
        {row.targetMinor !== null ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(row.fraction * 100)}%` }]} />
          </View>
        ) : null}
        <Text variant="label">{progress}</Text>
        {row.funded ? (
          <Text variant="caption">Fully set aside</Text>
        ) : perPayday !== undefined && perPayday > 0 ? (
          <Text variant="caption">{`Set aside ${money(perPayday)} each payday`}</Text>
        ) : null}
      </Pressable>
      {row.warnings.map((warning) => (
        <Text key={warning.kind} variant="caption" accessibilityRole="alert" style={styles.warning}>
          {warningText(warning)}
        </Text>
      ))}
      {row.targetMinor !== null ? (
        <Button title="Mark paid" variant="secondary" onPress={onMarkPaid} />
      ) : null}
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
  details: { gap: spacing[2] },
  top: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  name: { flex: 1 },
  track: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    height: spacing[2],
    overflow: "hidden",
  },
  fill: { backgroundColor: colors.sage, borderRadius: radii.full, height: "100%" },
  warning: { color: colors.textWarning },
});
