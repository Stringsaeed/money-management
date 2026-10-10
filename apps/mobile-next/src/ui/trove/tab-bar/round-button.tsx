import { StyleSheet, View, type ColorValue } from "react-native";

import { Icon, type IconName } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, radius } from "../tokens";
import { ROUND_BUTTON_SIZE } from "./constants";
import { TabBadge } from "./tab-badge";
import { TabBarSurface } from "./tab-bar-surface";

export interface RoundButtonProps {
  /** Spoken name; the button shows only an icon. */
  label: string;
  icon: IconName;
  /** `surface` is the bar's material; `accent` is the single highlighter button. */
  variant: "surface" | "accent";
  /** Surface variant only: a household-tinted fill with a 2pt accent ring, no blur. */
  tinted?: boolean;
  /** Reports an open menu to assistive tech; leave undefined for plain buttons. */
  expanded?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  badge?: boolean;
}

type Look = "surface" | "tinted" | "accent";

const lookFor = (variant: RoundButtonProps["variant"], tinted: boolean): Look => {
  if (variant === "accent") return "accent";
  return tinted ? "tinted" : "surface";
};

const ICON_COLOR = {
  surface: colors.text.primary,
  tinted: colors.accent.text,
  accent: colors.accent.on,
} as const satisfies Record<Look, ColorValue>;

/** A 60pt circle beside the pill: Accounts or Scope (surface) or Add (accent fill, accent.on icon). */
export function RoundButton({
  label,
  icon,
  variant,
  tinted = false,
  expanded,
  onPress,
  onLongPress,
  badge = false,
}: RoundButtonProps) {
  const look = lookFor(variant, tinted);
  const accent = look === "accent";
  const button = (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onLongPress={onLongPress}
      onPress={onPress}
      pressedStyle={pressedStyles[look]}
      style={[styles.button, fillStyles[look]]}
    >
      <Icon
        color={ICON_COLOR[look]}
        name={icon}
        size={accent ? 26 : 24}
        strokeWidth={accent ? 2.25 : undefined}
      />
      {badge ? <TabBadge style={styles.badge} /> : null}
    </PressableScale>
  );

  return look === "surface" ? (
    <TabBarSurface style={styles.surface}>{button}</TabBarSurface>
  ) : (
    <View style={styles.shell}>{button}</View>
  );
}

const styles = StyleSheet.create({
  surface: { height: ROUND_BUTTON_SIZE, width: ROUND_BUTTON_SIZE },
  button: {
    alignItems: "center",
    borderRadius: radius.full,
    height: ROUND_BUTTON_SIZE,
    justifyContent: "center",
    width: ROUND_BUTTON_SIZE,
  },
  shell: {
    borderRadius: radius.full,
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 24, color: colors.tabBar.shadow }],
  },
  badge: { right: 14, top: 14 },
});

const fillStyles = StyleSheet.create({
  surface: {},
  accent: { backgroundColor: colors.accent.fill },
  tinted: {
    backgroundColor: colors.accent.subtle,
    borderColor: colors.accent.text,
    borderWidth: 2,
  },
});

const pressedStyles = StyleSheet.create({
  surface: { backgroundColor: colors.fill.neutral },
  accent: { backgroundColor: colors.accent.pressed },
  // The tinted ring button gives scale feedback only.
  tinted: {},
});
