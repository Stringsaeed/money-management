import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { StyleSheet, useColorScheme } from "react-native";

import { troveRawColors } from "../tokens";
import { keyFromPickerValue, pickerValueFromKey } from "./date-utils";

interface DateCalendarProps {
  value: string;
  fallback: Date;
  onChange: (dateKey: string) => void;
}

/** The platform's own inline calendar, tinted with accent.text. */
export function DateCalendar({ value, fallback, onChange }: DateCalendarProps) {
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? troveRawColors.dark : troveRawColors.light;

  return (
    <DateTimePicker
      // Remount when a quick chip changes the date from outside the native picker.
      key={value}
      // The native tint rejects dynamic colors; bridge the canonical accent.text.
      accentColor={palette.accentText}
      display="inline"
      mode="date"
      onValueChange={(_, picked) => onChange(keyFromPickerValue(picked))}
      presentation="inline"
      style={styles.calendar}
      timeZoneName="UTC"
      value={pickerValueFromKey(value, fallback)}
    />
  );
}

const styles = StyleSheet.create({ calendar: { width: "100%" } });
