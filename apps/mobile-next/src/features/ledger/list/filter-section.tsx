import { StyleSheet, View } from "react-native";

import { Chip, space, Text } from "@/ui/trove";

export interface FilterOption<T extends string = string> {
  readonly id: T;
  readonly label: string;
}

interface FilterSectionProps<T extends string> {
  readonly title: string;
  readonly options: readonly FilterOption<T>[];
  readonly isSelected: (id: T) => boolean;
  readonly onToggle: (id: T) => void;
}

/** A labelled group of toggle chips inside the filter sheet. */
export function FilterSection<T extends string>({
  title,
  options,
  isSelected,
  onToggle,
}: FilterSectionProps<T>) {
  if (options.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="labelSm" tone="secondary">
        {title}
      </Text>
      <View style={styles.options}>
        {options.map((option) => (
          <Chip
            key={option.id}
            label={option.label}
            selected={isSelected(option.id)}
            onPress={() => onToggle(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2] },
  options: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
