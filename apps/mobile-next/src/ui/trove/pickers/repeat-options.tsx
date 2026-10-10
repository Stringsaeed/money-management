import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { space } from "../tokens";
import { RepeatOptionRow } from "./repeat-option-row";
import { dateFromKey } from "./date-utils";
import { repeatChoices, type RepeatRule } from "./repeat-utils";

export interface RepeatOptionsProps {
  /** The picked date as a `yyyy-MM-dd` key; the sentences are built from it. */
  date: string;
  value: RepeatRule;
  onChange: (rule: RepeatRule) => void;
  /** Caption above the list. */
  label?: string;
}

/**
 * Radio list of repeat sentences: "Doesn't repeat", "Every week on Saturday",
 * "Every month on the 10th", "Every year on 10 October".
 */
export function RepeatOptions({ date, value, onChange, label = "Repeat" }: RepeatOptionsProps) {
  const choices = repeatChoices(dateFromKey(date, new Date()));

  return (
    <View accessibilityLabel={label} accessibilityRole="radiogroup">
      <Text accessibilityRole="header" style={styles.caption} tone="tertiary" variant="stamp">
        {label}
      </Text>
      {choices.map((choice, index) => (
        <RepeatOptionRow
          checked={choice.rule === value}
          key={choice.rule}
          label={choice.label}
          last={index === choices.length - 1}
          onPress={() => onChange(choice.rule)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { paddingVertical: space[1] },
});
