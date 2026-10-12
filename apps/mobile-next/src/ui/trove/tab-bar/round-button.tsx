import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { useColorMode } from "../category/use-color-mode";
import { PressableScale } from "../pressable-scale";
import { colors, radius, troveRawColors } from "../tokens";
import { ROUND_BUTTON_SIZE } from "./constants";
import { TAB_BAR_GLASS } from "./glass";
import { TabBarSurface } from "./tab-bar-surface";

export interface RoundButtonProps {
  /** Spoken name; the button shows only a glyph. */
  label: string;
  /** `surface` is the bar's material; `accent` is the single highlighter button. */
  variant: "surface" | "accent";
  /** Reports an open menu to assistive tech; leave undefined for plain buttons. */
  expanded?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  children: ReactNode;
}

/**
 * A 60pt circle beside the pill: scope (bar material) or Add (flat accent fill). On Liquid
 * Glass both are glass, Add tinted accent.subtle, and a press only scales so no fill covers the
 * glass.
 */
export function RoundButton({
  label,
  variant,
  expanded,
  onPress,
  onLongPress,
  children,
}: RoundButtonProps) {
  const mode = useColorMode();
  const accent = variant === "accent";
  const button = (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onLongPress={onLongPress}
      onPress={onPress}
      pressedStyle={pressedStyle(accent)}
      style={[styles.button, accent && !TAB_BAR_GLASS ? styles.accent : null]}
    >
      {children}
    </PressableScale>
  );

  if (accent && !TAB_BAR_GLASS) return button;
  return (
    <TabBarSurface
      style={styles.surface}
      tint={accent ? troveRawColors[mode].accentSubtle : undefined}
    >
      {button}
    </TabBarSurface>
  );
}

const pressedStyle = (accent: boolean) => {
  if (TAB_BAR_GLASS) return undefined;
  return accent ? styles.accentPressed : styles.surfacePressed;
};

const styles = StyleSheet.create({
  surface: { height: ROUND_BUTTON_SIZE, width: ROUND_BUTTON_SIZE },
  button: {
    alignItems: "center",
    borderRadius: radius.full,
    height: ROUND_BUTTON_SIZE,
    justifyContent: "center",
    width: ROUND_BUTTON_SIZE,
  },
  accent: { backgroundColor: colors.accent.fill },
  accentPressed: { backgroundColor: colors.accent.pressed },
  surfacePressed: { backgroundColor: colors.fill.neutral },
});
