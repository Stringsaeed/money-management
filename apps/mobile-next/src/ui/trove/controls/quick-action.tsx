import { StyleSheet, View, type ColorValue, type GestureResponderEvent } from "react-native";

import { Icon, type IconName } from "../icon";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, colors, radius, space } from "../tokens";

export interface QuickActionProps {
  icon: IconName;
  /** Short verb under the disc: Add, Send, Move. */
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  /** The one lead action on a row takes the accent disc; the rest stay neutral. */
  emphasis?: "primary" | "neutral";
  disabled?: boolean;
  testID?: string;
}

const DISC = 52;

const ICON_COLOR = {
  primary: colors.accent.on,
  neutral: colors.text.primary,
} as const satisfies Record<NonNullable<QuickActionProps["emphasis"]>, ColorValue>;

/** Round icon disc with a caption, for the Add / Send / Move row. */
export function QuickAction({
  icon,
  label,
  onPress,
  emphasis = "neutral",
  disabled = false,
  testID,
}: QuickActionProps) {
  const color = disabled ? colors.text.disabled : ICON_COLOR[emphasis];
  const fill = disabled ? styles.disabled : discStyles[emphasis];

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.body}
      testID={testID}
    >
      <View style={[styles.disc, fill]}>
        <Icon color={color} name={icon} size={24} />
      </View>
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        tone={disabled ? "disabled" : "primary"}
        variant="labelSm"
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: "center", gap: space[2], minWidth: DISC },
  disc: {
    alignItems: "center",
    borderRadius: radius.full,
    height: DISC,
    justifyContent: "center",
    width: DISC,
  },
  disabled: { backgroundColor: colors.fill.disabled },
});

const discStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent.fill },
  neutral: { backgroundColor: colors.fill.neutral },
});
