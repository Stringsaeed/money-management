import { useState, type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../motion";
import { motion, troveTransition } from "./tokens";

export interface PressableScaleProps extends Omit<PressableProps, "children" | "style"> {
  children: ReactNode;
  /** Style of the animated body (fill, radius, padding). */
  style?: StyleProp<ViewStyle>;
  /** Layered over `style` while pressed, e.g. accent.pressed or fill.neutral. */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Off for rows that only change fill when pressed. Disabled colors stay with the caller. */
  scaleOnPress?: boolean;
}

/**
 * The one press behaviour for Trove controls and tappable cards: scale to 0.98 over
 * duration.fast, or no scale with Reduce Motion.
 */
export function PressableScale({
  children,
  style,
  pressedStyle,
  scaleOnPress = true,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const active = pressed && !disabled;

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      pressRetentionOffset={12}
    >
      <EaseView
        animate={{ scale: active && scaleOnPress && !reducedMotion ? motion.pressScale : 1 }}
        pointerEvents="box-none"
        style={[style, active ? pressedStyle : null]}
        transition={troveTransition(reducedMotion, motion.fast)}
      >
        {children}
      </EaseView>
    </Pressable>
  );
}
