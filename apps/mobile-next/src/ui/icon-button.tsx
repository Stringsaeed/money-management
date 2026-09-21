import { EaseView } from "react-native-ease";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { colors, radii, spacing } from "./design-tokens";
import { motionTransition, PRESS_TRANSITION, useReducedMotion } from "./motion";
import { Icon, type IconName } from "./icon";

export interface IconButtonProps {
  name: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  name,
  accessibilityLabel,
  onPress,
  disabled = false,
  style,
}: IconButtonProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      pressRetentionOffset={12}
    >
      {({ pressed }) => (
        <EaseView
          animate={{ opacity: disabled ? 0.45 : pressed ? 0.82 : 1, scale: pressed ? 0.95 : 1 }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, PRESS_TRANSITION)}
          style={[styles.button, style]}
        >
          <Icon name={name} size={20} />
        </EaseView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.full,
    height: spacing[11],
    justifyContent: "center",
    width: spacing[11],
  },
});
