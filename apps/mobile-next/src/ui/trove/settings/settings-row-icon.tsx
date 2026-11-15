import { StyleSheet, View } from "react-native";

import { Icon, type IconName } from "../icon";
import { colors, radius } from "../tokens";

interface SettingsRowIconProps {
  name: IconName;
  destructive: boolean;
}

export const SETTINGS_ICON_TILE = 32;

/** 32pt round tile with an 18pt icon; destructive rows tint it negative. */
export function SettingsRowIcon({ name, destructive }: SettingsRowIconProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, destructive ? styles.destructive : styles.neutral]}
    >
      <Icon
        color={destructive ? colors.negative.text : colors.text.primary}
        name={name}
        size={18}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    borderRadius: radius.full,
    height: SETTINGS_ICON_TILE,
    justifyContent: "center",
    width: SETTINGS_ICON_TILE,
  },
  neutral: { backgroundColor: colors.fill.neutral },
  destructive: { backgroundColor: colors.negative.subtle },
});
