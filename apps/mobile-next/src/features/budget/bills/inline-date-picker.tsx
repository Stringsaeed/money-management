import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { StyleSheet } from "react-native";

import { dateKeyFromPicker, datePickerValue } from "@/utils/date";

interface InlineDatePickerProps {
  readonly date: string;
  readonly onChange: (date: string) => void;
  readonly minDate?: string;
  readonly maxDate?: string;
}

/** The platform calendar shown in place under a date field, as Quick add does. */
export function InlineDatePicker({ date, onChange, minDate, maxDate }: InlineDatePickerProps) {
  return (
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
  );
}

const styles = StyleSheet.create({ picker: { width: "100%" } });
