import { StyleSheet, View } from "react-native";

import { Icon, type IconName } from "../icon";
import { colors, radius } from "../tokens";

export interface ListRowIconProps {
  name: IconName;
  destructive?: boolean;
}

/** 32pt neutral tile with an 18pt icon; destructive rows tint it negative. */
export function ListRowIcon({ name, destructive = false }: ListRowIconProps) {
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
    borderCurve: "continuous",
    borderRadius: radius.sm,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  neutral: { backgroundColor: colors.fill.neutral },
  destructive: { backgroundColor: colors.negative.subtle },
});
