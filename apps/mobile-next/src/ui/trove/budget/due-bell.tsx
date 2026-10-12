import { StyleSheet, Text as NativeText, View } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, fonts, layout, radius } from "../tokens";

export interface DueBellProps {
  /** Bills due soon; the badge hides at zero and caps at 9+. */
  count: number;
  onPress: () => void;
  /** e.g. "Due: 2 bills this week". */
  accessibilityLabel: string;
  accessibilityHint?: string;
  testID?: string;
}

const BADGE_SIZE = 18;

/** 44pt ringed disc with the bell, and a warning badge counting what is due. */
export function DueBell({
  count,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: DueBellProps) {
  return (
    <PressableScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.disc}
      testID={testID}
    >
      <Icon name="bell" size={20} />
      {count > 0 ? (
        <View pointerEvents="none" style={styles.badge}>
          <NativeText allowFontScaling={false} style={styles.badgeText}>
            {count > 9 ? "9+" : String(count)}
          </NativeText>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderRadius: radius.full,
    borderWidth: 1,
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
  },
  pressed: { backgroundColor: colors.surface.raised },
  badge: {
    backgroundColor: colors.warning.text,
    borderRadius: radius.full,
    height: BADGE_SIZE,
    minWidth: BADGE_SIZE,
    paddingHorizontal: 5,
    position: "absolute",
    // The board measures -2 from the ring's outer edge; the 1pt border sits inside this box.
    right: -3,
    top: -3,
  },
  badgeText: {
    color: colors.warningOn,
    fontFamily: fonts.monoSemibold,
    fontSize: 11,
    lineHeight: BADGE_SIZE,
    textAlign: "center",
  },
});
