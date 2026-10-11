import { StyleSheet, Text as NativeText } from "react-native";

import { colors, fonts, Icon, PressableScale, radius } from "@/ui/trove";

interface LedgerSearchPillProps {
  readonly onPress?: () => void;
}

/** The board's 48pt ringed pill; the ring is a border here, so the sides give up its point. */
const PAD_X = 15;

/** Ledger's search pill: a link into search, which takes over the screen. */
export function LedgerSearchPill({ onPress }: LedgerSearchPillProps) {
  return (
    <PressableScale
      accessibilityHint="Opens search"
      accessibilityLabel="Search notes"
      accessibilityRole="search"
      onPress={onPress}
      pressedStyle={styles.pressed}
      scaleOnPress={false}
      style={styles.pill}
    >
      <Icon color={colors.text.secondary} name="search" size={20} />
      <NativeText numberOfLines={1} style={styles.placeholder}>
        Search notes
      </NativeText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 48,
    paddingHorizontal: PAD_X,
  },
  pressed: { backgroundColor: colors.border.default },
  placeholder: {
    color: colors.text.secondary,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 22,
  },
});
