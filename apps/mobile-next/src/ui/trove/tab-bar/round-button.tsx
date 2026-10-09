import { StyleSheet, View } from "react-native";

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
  onPress: () => void;
  onLongPress?: () => void;
  badge?: boolean;
}

/** A 60pt circle beside the pill: Accounts (surface) or Add (accent fill, accent.on icon). */
export function RoundButton({
  label,
  icon,
  variant,
  onPress,
  onLongPress,
  badge = false,
}: RoundButtonProps) {
  const accent = variant === "accent";
  const button = (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onLongPress={onLongPress}
      onPress={onPress}
      pressedStyle={accent ? styles.accentPressed : styles.surfacePressed}
      style={[styles.button, accent && styles.accent]}
    >
      <Icon
        color={accent ? colors.accent.on : colors.text.primary}
        name={icon}
        size={accent ? 26 : 24}
        strokeWidth={accent ? 2.25 : undefined}
      />
      {badge ? <TabBadge style={styles.badge} /> : null}
    </PressableScale>
  );

  return accent ? (
    <View style={styles.accentShell}>{button}</View>
  ) : (
    <TabBarSurface style={styles.surface}>{button}</TabBarSurface>
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
  accentShell: {
    borderRadius: radius.full,
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 24, color: colors.tabBar.shadow }],
  },
  accent: { backgroundColor: colors.accent.fill },
  accentPressed: { backgroundColor: colors.accent.pressed },
  surfacePressed: { backgroundColor: colors.fill.neutral },
  badge: { right: 14, top: 14 },
});
