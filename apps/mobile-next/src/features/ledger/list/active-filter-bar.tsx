import { Pressable, ScrollView, StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { motionTransition, STATE_TRANSITION, useReducedMotion } from "@/ui/motion";

import type { ActiveFilter } from "./ledger-filters";
import { RemovableChip } from "./removable-chip";

interface ActiveFilterBarProps {
  readonly chips: readonly ActiveFilter[];
  readonly onRemove: (chip: ActiveFilter) => void;
  readonly onClear: () => void;
  /** Horizontal inset so chips can scroll edge to edge while aligning with the content. */
  readonly inset?: number;
}

/** Applied filters as removable chips, with "Clear all" once more than one is applied. */
export function ActiveFilterBar({ chips, onRemove, onClear, inset = 0 }: ActiveFilterBarProps) {
  const reducedMotion = useReducedMotion();
  if (chips.length === 0) return null;
  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: -4 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={motionTransition(reducedMotion, STATE_TRANSITION)}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
        style={{ marginHorizontal: -inset }}
      >
        {chips.map((chip) => (
          <RemovableChip key={chip.key} label={chip.label} onRemove={() => onRemove(chip)} />
        ))}
        {chips.length > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            hitSlop={8}
            onPress={onClear}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
          >
            <Text style={styles.clearLabel}>Clear all</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </EaseView>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", gap: spacing[2] },
  clear: { justifyContent: "center", paddingHorizontal: spacing[2], height: spacing[8] },
  pressed: { opacity: 0.6 },
  clearLabel: {
    color: colors.terracotta,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
});
