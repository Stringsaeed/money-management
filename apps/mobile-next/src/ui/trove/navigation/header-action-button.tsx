import { StyleSheet } from "react-native";

import { Icon, type IconName } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, layout, radius } from "../tokens";

export interface HeaderAction {
  icon: IconName;
  /** Required: header actions are icon-only. */
  label: string;
  onPress: () => void;
}

export interface HeaderActionButtonProps extends HeaderAction {
  /** `filled` is the 44pt neutral disc beside a large title; `plain` is a bare icon in a compact bar. */
  appearance: "filled" | "plain";
  /** Which edge a plain icon hugs, so the glyph lines up with the screen gutter. */
  align?: "start" | "center" | "end";
}

export function HeaderActionButton({
  icon,
  label,
  onPress,
  appearance,
  align = "end",
}: HeaderActionButtonProps) {
  const filled = appearance === "filled";

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={filled ? styles.filledPressed : null}
      style={[styles.base, filled ? styles.filled : alignStyles[align]]}
    >
      <Icon color={colors.text.primary} name={icon} size={filled ? 20 : 24} />
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
  filledPressed: { backgroundColor: colors.border.default },
});

const alignStyles = StyleSheet.create({
  center: { alignItems: "center" },
  start: { alignItems: "flex-start" },
  end: { alignItems: "flex-end" },
});
