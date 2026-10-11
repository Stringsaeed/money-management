import { StyleSheet } from "react-native";

import {
  colors,
  DENSE_MAX_FONT_SCALE,
  Icon,
  PressableScale,
  radius,
  Text,
  type IconName,
} from "@/ui/trove";

interface LedgerShortcutChipProps {
  readonly label: string;
  readonly icon: IconName;
  readonly onPress?: () => void;
}

/** Board chips are 36pt with 14pt sides inside a 1pt ring; the ring is a border here. */
const PAD_X = 13;

/** Outlined 36pt chip with a stroke icon: one of Ledger's secondary destinations. */
export function LedgerShortcutChip({ label, icon, onPress }: LedgerShortcutChipProps) {
  return (
    <PressableScale
      accessibilityLabel={`Open ${label}`}
      accessibilityRole="link"
      hitSlop={{ top: 4, bottom: 4 }}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.chip}
    >
      <Icon name={icon} size={18} strokeWidth={1.75} />
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} variant="labelMd">
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 36,
    paddingHorizontal: PAD_X,
  },
  pressed: { backgroundColor: colors.fill.neutral },
});
