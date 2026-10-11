import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ListGroup, ListRow, space, Text } from "@/ui/trove";
import { dateKeyFromPicker, datePickerValue } from "@/utils/date";

import { transactionDateLabel } from "../../ledger/transactions/transaction-display";

interface QuickAddDateProps {
  readonly date: string;
  readonly onChange: (date: string) => void;
  /** Where this date lands when it is not the current period, e.g. "Added to 25 Oct – 24 Nov". */
  readonly placementNote: string | null;
  readonly label?: string;
  /** Earliest and latest Ledger Dates the picker offers. */
  readonly minDate?: string;
  readonly maxDate?: string;
}

/** Defaults to today; tapping the row opens the date picker in place. */
export function QuickAddDate({
  date,
  onChange,
  placementNote,
  label: title = "Date",
  minDate,
  maxDate,
}: QuickAddDateProps) {
  const [open, setOpen] = useState(false);
  const label = transactionDateLabel(date);

  return (
    <View style={styles.container}>
      <ListGroup dividerInset={0}>
        <ListRow
          accessibilityLabel={`${title}: ${label}`}
          onPress={() => setOpen((current) => !current)}
          title={title}
          value={label}
        />
      </ListGroup>
      {placementNote ? (
        <Text tone="secondary" variant="bodySm">
          {placementNote}
        </Text>
      ) : null}
      {open ? (
        <DateTimePicker
          key={date}
          value={datePickerValue(date)}
          mode="date"
          display="inline"
          presentation="inline"
          style={styles.picker}
          timeZoneName="UTC"
          minimumDate={minDate ? datePickerValue(minDate) : undefined}
          maximumDate={maxDate ? datePickerValue(maxDate) : undefined}
          onValueChange={(_, value) => onChange(dateKeyFromPicker(value))}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[1] },
  picker: { width: "100%" },
});
