import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { V2PaydayRule } from "@trove/api/v2/contracts";

import { Chip, space, Text } from "@/ui/trove";

import { ordinal, paydayLabel } from "./payday-label";

const QUICK_DAYS = [1, 25, 28] as const;
const ALL_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

interface PaydayPickerProps {
  readonly value: V2PaydayRule | null;
  readonly onChange: (rule: V2PaydayRule) => void;
}

const isQuickDay = (value: V2PaydayRule | null): boolean =>
  value?.kind === "day" && QUICK_DAYS.some((day) => day === value.day);

/** Payday chips (1st, 25th, 28th, Last workday) plus a 1 to 28 picker. 29 to 31 are not offered. */
export function PaydayPicker({ value, onChange }: PaydayPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(() => value?.kind === "day" && !isQuickDay(value));
  const otherSelected = value?.kind === "day" && !isQuickDay(value);

  return (
    <View style={styles.group}>
      <View style={styles.chips}>
        {QUICK_DAYS.map((day) => (
          <Chip
            key={day}
            label={ordinal(day)}
            selected={value?.kind === "day" && value.day === day}
            onPress={() => {
              setPickerOpen(false);
              onChange({ kind: "day", day });
            }}
          />
        ))}
        <Chip
          label="Last workday"
          selected={value?.kind === "last_workday"}
          onPress={() => {
            setPickerOpen(false);
            onChange({ kind: "last_workday" });
          }}
        />
        <Chip
          label={otherSelected ? paydayLabel(value) : "Another day"}
          selected={otherSelected || pickerOpen}
          onPress={() => setPickerOpen(true)}
        />
      </View>
      {pickerOpen ? (
        <View style={styles.days}>
          <Text variant="bodySm" tone="secondary">
            Paid on the 29th to 31st? Choose Last workday.
          </Text>
          <View style={styles.chips}>
            {ALL_DAYS.map((day) => (
              <Chip
                key={day}
                label={String(day)}
                selected={value?.kind === "day" && value.day === day}
                onPress={() => onChange({ kind: "day", day })}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[3] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  days: { gap: space[2] },
});
