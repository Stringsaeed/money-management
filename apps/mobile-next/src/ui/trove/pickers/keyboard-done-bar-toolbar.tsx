import { StyleSheet, View } from "react-native";

import { Button } from "../controls/button";
import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, space } from "../tokens";

export interface KeyboardDoneBarToolbarProps {
  /** Arrows show only when a handler exists; with just one, the other is disabled. */
  onPrevious?: () => void;
  onNext?: () => void;
  onDone: () => void;
  doneLabel?: string;
}

interface StepButtonProps {
  label: string;
  direction: "previous" | "next";
  onPress?: () => void;
}

function StepButton({ label, direction, onPress }: StepButtonProps) {
  const disabled = !onPress;
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={2}
      onPress={onPress}
      pressedStyle={styles.stepPressed}
      style={styles.step}
    >
      <View style={direction === "previous" ? styles.flipped : undefined}>
        <Icon
          color={disabled ? colors.text.disabled : colors.text.secondary}
          name="chevron-down"
          size={20}
        />
      </View>
    </PressableScale>
  );
}

/** The bar's contents: previous / next field on the left, Done on the right. */
export function KeyboardDoneBarToolbar({
  onPrevious,
  onNext,
  onDone,
  doneLabel = "Done",
}: KeyboardDoneBarToolbarProps) {
  const showSteps = Boolean(onPrevious ?? onNext);

  return (
    <View accessibilityLabel="Keyboard" accessibilityRole="toolbar" style={styles.bar}>
      {showSteps ? (
        <>
          <StepButton direction="previous" label="Previous field" onPress={onPrevious} />
          <StepButton direction="next" label="Next field" onPress={onNext} />
        </>
      ) : null}
      <View style={styles.spacer} />
      <Button label={doneLabel} onPress={onDone} size="sm" />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    backgroundColor: colors.surface.raised,
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: space[1],
    height: 48,
    paddingHorizontal: space[2],
  },
  step: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  stepPressed: { backgroundColor: colors.fill.neutral },
  flipped: { transform: [{ rotate: "180deg" }] },
  spacer: { flex: 1 },
});
