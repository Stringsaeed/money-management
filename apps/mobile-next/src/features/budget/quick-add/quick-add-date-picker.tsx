import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { StyleSheet } from "react-native";

import { dateKeyFromPicker, datePickerValue } from "@/utils/date";

interface QuickAddDatePickerProps {
  readonly date: string;
  readonly onChange: (date: string) => void;
}

/** The inline calendar behind Quick add's date chip. */
export function QuickAddDatePicker({ date, onChange }: QuickAddDatePickerProps) {
  return (
    <DateTimePicker
      key={date}
      display="inline"
      mode="date"
      onValueChange={(_, value) => onChange(dateKeyFromPicker(value))}
      presentation="inline"
      style={styles.picker}
      timeZoneName="UTC"
      value={datePickerValue(date)}
    />
  );
}

const styles = StyleSheet.create({ picker: { width: "100%" } });
