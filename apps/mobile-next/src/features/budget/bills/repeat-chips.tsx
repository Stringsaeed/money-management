import { StyleSheet, View } from "react-native";

import type { V2EnvelopeRepeat } from "@trove/api/v2/contracts";

import { SelectChip, Text } from "@/ui/trove";

import { REPEAT_LABELS, REPEAT_OPTIONS } from "./big-payment-model";

interface RepeatChipsProps {
  readonly value: V2EnvelopeRepeat;
  readonly onChange: (value: V2EnvelopeRepeat) => void;
}

/** REPEATS: once, every 3 months, every 6 months, or yearly. */
export function RepeatChips({ value, onChange }: RepeatChipsProps) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" tone="tertiary" variant="stamp">
        Repeats
      </Text>
      <View accessibilityLabel="Repeats" accessibilityRole="radiogroup" style={styles.chips}>
        {REPEAT_OPTIONS.map((option) => (
          <SelectChip
            key={option}
            label={REPEAT_LABELS[option]}
            onPress={() => onChange(option)}
            selected={option === value}
            size="md"
            variant="envelope"
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
