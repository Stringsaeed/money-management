import { StyleSheet, Text as NativeText } from "react-native";

import {
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  Icon,
  PressableScale,
  radius,
  Text,
} from "@/ui/trove";

interface MoveEndRowProps {
  /** "FROM" or "TO". */
  readonly end: string;
  /** Absent until a place is picked. */
  readonly name?: string;
  readonly emoji?: string;
  /** What the place has left now, e.g. `282`, `−175`. */
  readonly left?: string;
  readonly negative?: boolean;
  /** This end's picker is open. */
  readonly expanded: boolean;
  readonly onPress: () => void;
}

/** One end of a move: a 64pt card with FROM/TO, the place, what it has left, and a chevron. */
export function MoveEndRow({
  end,
  name,
  emoji,
  left,
  negative = false,
  expanded,
  onPress,
}: MoveEndRowProps) {
  return (
    <PressableScale
      accessibilityLabel={
        name ? `${end}: ${name}, ${left ?? ""} left. Change` : `${end}: pick an envelope`
      }
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.row}
    >
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.end}
        tone="tertiary"
        variant="stamp"
      >
        {end}
      </Text>
      {emoji ? (
        <NativeText
          accessibilityElementsHidden
          importantForAccessibility="no"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={styles.emoji}
        >
          {emoji}
        </NativeText>
      ) : null}
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.name, name ? null : styles.placeholder]}
      >
        {name ?? "Pick an envelope"}
      </NativeText>
      {left ? (
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          tone={negative ? "negative" : "primary"}
          variant="amountMd"
        >
          {left}
        </Text>
      ) : null}
      <Icon color={colors.text.tertiary} name="chevron-right" size={14} strokeWidth={2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  // Board ring is a 1pt inset shadow; the native border takes it back out of the 16pt padding.
  row: {
    alignItems: "center",
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 15,
  },
  pressed: { backgroundColor: colors.fill.neutral },
  end: { width: 40 },
  emoji: { fontSize: 20, lineHeight: 26 },
  // Board: Nunito 800 16; no Text variant is 800 at 16.
  name: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: fonts.extrabold,
    fontSize: 16,
    lineHeight: 22,
  },
  placeholder: { color: colors.text.secondary },
});
