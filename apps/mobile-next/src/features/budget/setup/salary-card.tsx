import { useRef } from "react";
import { Pressable, StyleSheet, View, type TextInput } from "react-native";

import { colors, radius, space, Switch, Text } from "@/ui/trove";

import { InlineAmountInput } from "./inline-amount-input";

interface SalaryCardProps {
  readonly currency: string;
  readonly salary: string;
  readonly salaryInvalid: boolean;
  readonly onSalary: (text: string) => void;
  readonly reminder: boolean;
  readonly onReminder: (on: boolean) => void;
}

/** S2's grouped card: the optional usual salary, and the payday reminder switch. */
export function SalaryCard({
  currency,
  salary,
  salaryInvalid,
  onSalary,
  reminder,
  onReminder,
}: SalaryCardProps) {
  const input = useRef<TextInput>(null);
  return (
    <View style={styles.card}>
      <Pressable
        accessible={false}
        onPress={() => input.current?.focus()}
        style={[styles.row, styles.divided]}
      >
        <View style={styles.texts}>
          <Text variant="labelMd">Usual salary</Text>
          <Text style={styles.sub} tone={salaryInvalid ? "negative" : "tertiary"}>
            {salaryInvalid
              ? "Enter an amount like 12000 or 12000.50."
              : "Optional · only used for the payday reminder"}
          </Text>
        </View>
        <InlineAmountInput
          accessibilityLabel={`Usual salary, ${currency}, optional`}
          currency={currency}
          inputRef={input}
          onChangeText={onSalary}
          size="salary"
          value={salary}
        />
      </Pressable>
      <View style={styles.row}>
        <Text style={styles.texts} variant="labelMd">
          Remind me on payday
        </Text>
        <Switch
          accessibilityLabel="Remind me on payday"
          value={reminder}
          onValueChange={onReminder}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    minHeight: 54,
    paddingHorizontal: space[4] - 1,
  },
  divided: { borderBottomColor: colors.border.subtle, borderBottomWidth: 1 },
  texts: { flex: 1 },
  sub: { fontSize: 12, lineHeight: 16 },
});
