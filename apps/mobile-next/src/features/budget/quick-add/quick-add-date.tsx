import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { dateKeyFromPicker, datePickerValue } from "@/utils/date";

import { transactionDateLabel } from "../../ledger/transactions/transaction-display";

interface QuickAddDateProps {
  readonly date: string;
  readonly onChange: (date: string) => void;
  /** Where this date lands when it is not the current period, e.g. "Added to 25 Oct – 24 Nov". */
  readonly placementNote: string | null;
}

/** Defaults to today; tapping the row opens the date picker in place. */
export function QuickAddDate({ date, onChange, placementNote }: QuickAddDateProps) {
  const [open, setOpen] = useState(false);
  const label = transactionDateLabel(date);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Date: ${label}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={styles.row}
      >
        <Text variant="label">Date</Text>
        <Text>{label}</Text>
      </Pressable>
      {placementNote ? <Text variant="caption">{placementNote}</Text> : null}
      {open ? (
        <DateTimePicker
          key={date}
          value={datePickerValue(date)}
          mode="date"
          display="inline"
          presentation="inline"
          style={styles.picker}
          timeZoneName="UTC"
          onValueChange={(_, value) => onChange(dateKeyFromPicker(value))}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[1] },
  row: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  picker: { width: "100%" },
});
