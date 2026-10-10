import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius } from "../tokens";
import { BADGE_SIZE } from "./constants";

export interface TabBadgeProps {
  /** Where the dot sits inside its button. */
  style?: StyleProp<ViewStyle>;
}

/** Eight-point attention dot with a 2pt ring of the surface behind it. */
export function TabBadge({ style }: TabBadgeProps) {
  return <View pointerEvents="none" style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.negative.text,
    borderColor: colors.surface.raised,
    borderRadius: radius.full,
    borderWidth: 2,
    boxSizing: "content-box",
    height: BADGE_SIZE,
    position: "absolute",
    width: BADGE_SIZE,
  },
});
