import type { ReactNode } from "react";
import {
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { PressableScale } from "../pressable-scale";
import { colors } from "../tokens";

export interface PressableRowProps {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Spoken label for the whole row. Without one, children stay individually reachable. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Defaults to button. A selectable row is a checkbox. */
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  testID?: string;
}

const PRESSED = { backgroundColor: colors.fill.neutral } as const;

/**
 * Shared row shell: a pressable that fills with fill.neutral (no scale — rows sit flush in a
 * group), or a plain View when there is nothing to press.
 */
export function PressableRow({
  children,
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
  accessibilityState,
  testID,
}: PressableRowProps) {
  if (!onPress) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityState ? accessibilityRole : undefined}
        accessibilityState={accessibilityState}
        accessible={accessibilityLabel !== undefined}
        style={style}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  return (
    <PressableScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      onPress={onPress}
      pressedStyle={PRESSED}
      scaleOnPress={false}
      style={style}
      testID={testID}
    >
      {children}
    </PressableScale>
  );
}
