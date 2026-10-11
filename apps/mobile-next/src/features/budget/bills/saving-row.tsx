import { format, parseISO } from "date-fns";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button, Card, PressableScale, ProgressBar, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { REPEAT_LABELS } from "./big-payment-model";
import type { SavingRow as SavingRowData, SavingWarning } from "./bills-model";

interface SavingRowProps {
  readonly row: SavingRowData;
  readonly onPress: () => void;
  readonly onMarkPaid?: () => void;
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
    <Card style={styles.card}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={[envelope.name, due, progress].filter(Boolean).join(", ")}
        onPress={onPress}
        scaleOnPress={false}
        style={styles.details}
      >
        <View style={styles.top}>
          <Text variant="labelMd" style={styles.name} numberOfLines={1}>
            {envelope.name}
          </Text>
          {due ? (
            <Text tone="secondary" variant="bodySm">
              {due}
            </Text>
          ) : null}
        </View>
        {row.targetMinor !== null ? <ProgressBar fraction={row.fraction} /> : null}
        <Text tone="secondary" variant="labelSm">
          {progress}
        </Text>
        {row.funded ? (
          <Text tone="secondary" variant="bodySm">
            Fully set aside
          </Text>
        ) : perPayday !== undefined && perPayday > 0 ? (
          <Text tone="secondary" variant="bodySm">
            {`Set aside ${money(perPayday)} each payday`}
          </Text>
        ) : null}
      </PressableScale>
      {row.warnings.map((warning) => (
        <Text key={warning.kind} accessibilityRole="alert" tone="warning" variant="bodySm">
          {warningText(warning)}
        </Text>
      ))}
      {row.targetMinor !== null && onMarkPaid ? (
        <Button fullWidth label="Mark paid" variant="secondary" onPress={onMarkPaid} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[3] },
  details: { gap: space[2] },
  top: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    justifyContent: "space-between",
  },
  name: { flex: 1 },
});
