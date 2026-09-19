import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { Easing, LinearTransition } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { useCategories } from "@/hooks/use-categories";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

interface CategoryChipProps {
  name: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
}

function CategoryChip({ name, color, isSelected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      aria-label={name}
      aria-selected={isSelected}
      onPress={onPress}
      role="button"
      style={[
        styles.chip,
        isSelected ? { borderColor: color, backgroundColor: `${color}20` } : styles.chipUnselected,
      ]}
    >
      <View style={[styles.colorDot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.chipLabel,
          isSelected ? { color, fontFamily: typography.fontBodySemibold } : styles.chipLabelIdle,
        ]}
      >
        {name}
      </Text>
    </Pressable>
  );
}

interface CategoryPickerProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  type: "income" | "expense";
  label?: string;
  horizontal?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  type,
  label,
  horizontal = false,
}: CategoryPickerProps) {
  const { data: categories = [] } = useCategories(type);
  const cats = categories.filter((category) => category.lifecycle === "active");

  if (horizontal) {
    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {cats.map((cat) => (
            <CategoryChip
              key={cat.id}
              name={cat.name}
              color={cat.color}
              isSelected={cat.id === value}
              onPress={() => onChange(cat.id === value ? null : cat.id)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View layout={LinearTransition.easing(Easing.ease)} style={styles.wrapRow}>
        {cats.map((cat) => (
          <CategoryChip
            key={cat.id}
            name={cat.name}
            color={cat.color}
            isSelected={cat.id === value}
            onPress={() => onChange(cat.id === value ? null : cat.id)}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.foreground,
  },
  chipRow: {
    gap: spacing[2],
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
    borderRadius: radii.full,
    borderWidth: 2,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  chipUnselected: {
    borderColor: colors.input,
    backgroundColor: colors.card,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  chipLabel: {
    fontSize: typography.textSm,
  },
  chipLabelIdle: {
    fontFamily: typography.fontBodyNormal,
    color: colors.foreground,
  },
});
