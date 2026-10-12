import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import type { V2PaydayRule } from "@trove/api/v2/contracts";

import { useReducedMotion } from "@/ui/motion";
import { motion, SelectChip, space, Text, troveTransition } from "@/ui/trove";

import { ordinal, paydayLabel } from "./payday-label";

const QUICK_DAYS = [1, 25, 28] as const;
const ALL_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

interface PaydayPickerProps {
  readonly value: V2PaydayRule | null;
  readonly onChange: (rule: V2PaydayRule) => void;
}

const isQuickDay = (value: V2PaydayRule | null): boolean =>
  value?.kind === "day" && QUICK_DAYS.some((day) => day === value.day);

/**
 * Payday chips (1st, 25th, 28th, Last workday, Other day…). Other day opens a 1 to 28 grid;
 * 29 to 31 are not offered. A day picked there names the Other chip, e.g. "15th".
 */
export function PaydayPicker({ value, onChange }: PaydayPickerProps) {
  const reducedMotion = useReducedMotion();
  const [pickerOpen, setPickerOpen] = useState(() => value?.kind === "day" && !isQuickDay(value));
  const otherSelected = value?.kind === "day" && !isQuickDay(value);

  return (
    <View style={styles.group}>
      <View accessibilityLabel="Payday" accessibilityRole="radiogroup" style={styles.chips}>
        {QUICK_DAYS.map((day) => (
          <SelectChip
            key={day}
            label={ordinal(day)}
            selected={value?.kind === "day" && value.day === day}
            onPress={() => {
              setPickerOpen(false);
              onChange({ kind: "day", day });
            }}
          />
        ))}
        <SelectChip
          label="Last workday"
          selected={value?.kind === "last_workday"}
          onPress={() => {
            setPickerOpen(false);
            onChange({ kind: "last_workday" });
          }}
        />
        <SelectChip
          label={otherSelected ? paydayLabel(value) : "Other day…"}
          selected={otherSelected}
          accessibilityHint="Shows every day from the 1st to the 28th"
          onPress={() => setPickerOpen(true)}
        />
      </View>
      {pickerOpen ? (
        <EaseView
          animate={{ opacity: 1 }}
          initialAnimate={{ opacity: 0 }}
          style={styles.days}
          transition={troveTransition(reducedMotion, motion.base)}
        >
          <Text variant="bodySm" tone="secondary">
            Paid on the 29th to 31st? Choose Last workday.
          </Text>
          <View
            accessibilityLabel="Day of the month"
            accessibilityRole="radiogroup"
            style={styles.chips}
          >
            {ALL_DAYS.map((day) => (
              <SelectChip
                key={day}
                label={String(day)}
                size="md"
                accessibilityLabel={ordinal(day)}
                selected={value?.kind === "day" && value.day === day}
                onPress={() => onChange({ kind: "day", day })}
              />
            ))}
          </View>
        </EaseView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[3] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  days: { gap: space[2] },
});
