import { useState } from "react";
import { DateTimePicker as ExpoDateTimePicker } from "@expo/ui/community/datetime-picker";
import { StyleSheet } from "react-native";

import { Button } from "@/ui/button";
import { Text } from "@/ui/text";
import { Sheet } from "@/ui/sheet";
import { dateKeyFromPicker, datePickerValue } from "@/utils/date";

import { BreadcrumbSegment } from "./breadcrumb-segment";
import { transactionDateLabel } from "./transaction-display";

interface DatePickerProps {
  readonly date: string;
  readonly onChange: (date: string) => void;
}

export function DatePicker({ date, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const label = transactionDateLabel(date);

  return (
    <>
      <BreadcrumbSegment
        accessibilityLabel={`Date: ${label}`}
        emoji="📅"
        label={label}
        onPress={() => setOpen(true)}
      />
      <Sheet open={open} onDismiss={() => setOpen(false)}>
        <Text variant="title">📅 Date</Text>
        <ExpoDateTimePicker
          key={date}
          value={datePickerValue(date)}
          mode="date"
          display="inline"
          presentation="inline"
          style={styles.picker}
          timeZoneName="UTC"
          onValueChange={(_, value) => onChange(dateKeyFromPicker(value))}
        />
        <Button title="Done" onPress={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({ picker: { width: "100%" } });
