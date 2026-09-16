import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  CATEGORY_TYPE_OPTIONS,
  type CategoryType,
} from "@/components/category/category-form-options";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

interface CategoryTypePickerProps {
  value: CategoryType;
  onChange: (value: CategoryType) => void;
}

export function CategoryTypePicker({ value, onChange }: CategoryTypePickerProps) {
  return (
    <View style={styles.row}>
      {CATEGORY_TYPE_OPTIONS.map((option) => {
        const isSelected = option.value === value;

        return (
          <Animated.View
            key={option.value}
            layout={layoutTransition}
            style={{
              flex: 1,
              transform: [{ scale: isSelected ? 1 : 0.97 }],
              transitionProperty: "transform",
              transitionDuration: 220,
              transitionTimingFunction: "ease-out",
            }}
          >
            <Pressable
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
                isSelected && { backgroundColor: `${option.color}14`, borderColor: option.color },
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.labelText,
                  isSelected ? styles.labelSelected : styles.labelUnselected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing[2],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1.5],
    borderRadius: radii["2xl"],
    borderWidth: 1,
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[3],
  },
  chipSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  chipUnselected: {
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  chipPressed: {
    backgroundColor: colors.surfaceDim,
  },
  emoji: {
    fontSize: typography.textSm,
  },
  labelText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  labelSelected: {
    color: colors.ink,
  },
  labelUnselected: {
    color: colors.ink,
    opacity: 0.8,
  },
});
