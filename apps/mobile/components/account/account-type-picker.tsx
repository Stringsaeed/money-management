import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

import { ACCOUNT_TYPE_OPTIONS } from "@/components/account/account-form-options";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import type { AccountType } from "@/types";

interface AccountTypePickerProps {
  value: AccountType;
  onChange: (value: AccountType) => void;
  /** Override the scroller's padding when the row bleeds past its container. */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function AccountTypePicker({
  value,
  onChange,
  contentContainerStyle,
}: AccountTypePickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
    >
      {ACCOUNT_TYPE_OPTIONS.map((option) => {
        const isSelected = option.value === value;

        return (
          <Animated.View key={option.value} layout={layoutTransition}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing[2],
    paddingRight: spacing[5],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[2],
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
