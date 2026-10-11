import { ScrollView, StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import { motionTransition, STATE_TRANSITION, useReducedMotion } from "@/ui/motion";
import { Button, Chip, layout, space } from "@/ui/trove";

import type { ActiveFilter } from "./ledger-filters";

interface ActiveFilterBarProps {
  readonly chips: readonly ActiveFilter[];
  readonly onRemove: (chip: ActiveFilter) => void;
  readonly onClear: () => void;
}

/**
 * Applied filters as removable chips, with "Clear all" once more than one is applied. The row
 * bleeds past the screen gutter so chips scroll edge to edge while aligning with the content.
 */
export function ActiveFilterBar({ chips, onRemove, onClear }: ActiveFilterBarProps) {
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
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {chips.map((chip) => (
          <Chip
            key={chip.key}
            label={chip.label}
            selected
            onPress={() => onRemove(chip)}
            onRemove={() => onRemove(chip)}
          />
        ))}
        {chips.length > 1 ? (
          <Button
            label="Clear all"
            variant="tertiary"
            size="sm"
            accessibilityLabel="Clear all filters"
            onPress={onClear}
          />
        ) : null}
      </ScrollView>
    </EaseView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -layout.screenGutter },
  row: { alignItems: "center", gap: space[2], paddingHorizontal: layout.screenGutter },
});
