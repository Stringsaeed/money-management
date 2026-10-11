import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, fonts, Icon, layout, PressableScale, radius } from "@/ui/trove";

interface HomeBellButtonProps {
  /** Bills due this week; the badge hides at zero. */
  readonly count: number;
  readonly onPress: () => void;
}

const BADGE_SIZE = 18;

/** 44pt ringed disc with the bell, and a warning badge counting this week's bills. */
export function HomeBellButton({ count, onPress }: HomeBellButtonProps) {
  const label =
    count > 0
      ? `Due: ${count} ${count === 1 ? "bill" : "bills"} this week`
      : "Nothing due this week";
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.disc}
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
