import { Pressable, StyleSheet, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { ColorPalette } from "@/constants/theme";
import { colors, radii, shadows, spacing } from "@/lib/design-tokens";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.row}>
      {ColorPalette.map((color) => {
        const isSelected = value === color;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityRole="button"
            accessibilityLabel={`Color ${color}`}
            accessibilityState={{ selected: value === color }}
            style={[
              styles.swatch,
              { backgroundColor: color },
              isSelected && styles.swatchSelected,
            ]}
          >
            {isSelected ? (
              <Icon
                as={CheckIcon}
                style={styles.checkIcon}
                size={13}
                weight="bold"
                testID="selected-color-check"
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2.5],
    paddingVertical: spacing[1],
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: colors.background,
    boxShadow: shadows.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
  },
  checkIcon: {
    color: "#ffffff",
  },
});
