import { StyleSheet, View } from "react-native";

import { Button } from "../controls/button";
import { Icon } from "../icon";
import { Chip, Sheet } from "../navigation";
import { Text } from "../text";
import { space } from "../tokens";
import { DateCalendar } from "./date-calendar";
import { quickDateChips } from "./date-utils";
import { RepeatOptions } from "./repeat-options";
import type { RepeatRule } from "./repeat-utils";

export interface DateSheetProps {
  open: boolean;
  onDismiss: () => void;
  /** Picked date as a `yyyy-MM-dd` key. */
  value: string;
  onChange: (dateKey: string) => void;
  /** Add the repeat list by passing both `repeat` and `onRepeatChange`. */
  repeat?: RepeatRule;
  onRepeatChange?: (rule: RepeatRule) => void;
  title?: string;
  /** Reference for the quick chips; defaults to now. */
  today?: Date;
  testID?: string;
}

/**
 * Date picker sheet: header with Done, quick chips (Today / Yesterday / 2 days ago), the
 * platform's inline calendar, and optionally the repeat sentences built from the picked date.
 */
export function DateSheet({
  open,
  onDismiss,
  value,
  onChange,
  repeat,
  onRepeatChange,
  title = "Date",
  today = new Date(),
  testID,
}: DateSheetProps) {
  const withRepeat = repeat !== undefined && onRepeatChange !== undefined;

  return (
    <Sheet
      onDismiss={onDismiss}
      open={open}
      snapPoints={withRepeat ? ["full"] : undefined}
      testID={testID}
    >
      <View style={styles.header}>
        <Icon name="calendar" />
        <Text accessibilityRole="header" style={styles.title} variant="titleMd">
          {title}
        </Text>
        <Button label="Done" onPress={onDismiss} size="sm" />
      </View>
      <View style={styles.chips}>
        {quickDateChips(today).map((chip) => (
          <Chip
            key={chip.id}
            label={chip.label}
            onPress={() => onChange(chip.dateKey)}
            selected={chip.dateKey === value}
          />
        ))}
      </View>
      <DateCalendar fallback={today} onChange={onChange} value={value} />
      {withRepeat ? <RepeatOptions date={value} onChange={onRepeatChange} value={repeat} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", gap: space[2] },
  title: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[1] + 2 },
});
