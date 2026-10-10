import { StyleSheet, type ColorValue } from "react-native";

import { Icon, type IconName } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, layout, radius } from "../tokens";

export interface HeaderAction {
  icon: IconName;
  /** Required: header actions are icon-only. */
  label: string;
  onPress: () => void;
  /** `negative` tints a destructive action, e.g. delete. */
  tone?: "negative";
  /** Greys the action out and blocks presses, e.g. Save until the form is valid. */
  disabled?: boolean;
}

export interface HeaderActionButtonProps extends HeaderAction {
  /** `filled` is the 44pt neutral disc beside a large title; `plain` is a bare icon in a compact bar. */
  appearance: "filled" | "plain";
  /** Which edge a plain icon hugs, so the glyph lines up with the screen gutter. */
  align?: "start" | "center" | "end";
}

function iconColor(tone: HeaderAction["tone"], disabled: boolean): ColorValue {
  if (disabled) return colors.text.disabled;
  return tone === "negative" ? colors.negative.text : colors.text.primary;
}

function fillStyle(tone: HeaderAction["tone"], disabled: boolean) {
  if (disabled) return styles.filledDisabled;
  return tone === "negative" ? styles.filledNegative : styles.filled;
}

export function HeaderActionButton({
  icon,
  label,
  onPress,
  tone,
  disabled = false,
  appearance,
  align = "end",
}: HeaderActionButtonProps) {
  const filled = appearance === "filled";

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      pressedStyle={filled && tone !== "negative" ? styles.filledPressed : null}
      style={[styles.base, filled ? fillStyle(tone, disabled) : alignStyles[align]]}
    >
      <Icon color={iconColor(tone, disabled)} name={icon} size={filled ? 20 : 24} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
  },
  filled: { backgroundColor: colors.fill.neutral, borderRadius: radius.full },
  filledNegative: { backgroundColor: colors.negative.subtle, borderRadius: radius.full },
  filledDisabled: { backgroundColor: colors.fill.neutral, borderRadius: radius.full },
  filledPressed: { backgroundColor: colors.border.default },
});

const alignStyles = StyleSheet.create({
  center: { alignItems: "center" },
  start: { alignItems: "flex-start" },
  end: { alignItems: "flex-end" },
});
