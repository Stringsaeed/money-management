import { StyleSheet, Text as NativeText, type TextStyle, type ViewStyle } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, layout, PressableScale, radius } from "@/ui/trove";

type PillAppearance = "outline" | "filled" | "toggle";
type PillSize = "sm" | "md";

interface PaydayPillProps {
  readonly label: string;
  readonly onPress: () => void;
  /**
   * outline: bare with a 1pt ring (Accept, Adjust) · filled: neutral fill and ring (Raise) ·
   * toggle: accent tint when `selected`, bare secondary label otherwise (Matches ✓).
   */
  readonly appearance: PillAppearance;
  /** md 36pt/14 (wrap-up cards) · sm 34pt/13 (balance rows). */
  readonly size: PillSize;
  readonly selected?: boolean;
  readonly accessibilityLabel?: string;
  readonly accessibilityHint?: string;
}

const HEIGHT = { sm: 34, md: 36 } as const satisfies Record<PillSize, number>;

/** Small action pill inside the payday cards and rows; the BudgetPill kit has only solid tones. */
export function PaydayPill({
  label,
  onPress,
  appearance,
  size,
  selected = false,
  accessibilityLabel = label,
  accessibilityHint,
}: PaydayPillProps) {
  const slop = (layout.minTouchTarget - HEIGHT[size]) / 2;
  const toggle = appearance === "toggle";
  const on = toggle && selected;
  const look = pillLook(appearance, selected);
  return (
    <PressableScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={toggle ? "togglebutton" : "button"}
      accessibilityState={toggle ? { checked: selected } : undefined}
      hitSlop={{ bottom: slop, left: 0, right: 0, top: slop }}
      onPress={onPress}
      pressedStyle={on ? null : styles.pressed}
      style={[styles.pill, SIZE[size], look.body]}
    >
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.label, LABEL[size], look.ink]}
      >
        {label}
      </NativeText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: { alignItems: "center", borderRadius: radius.full, justifyContent: "center" },
  // Board rings are inset shadows; the native border's width comes back off the padding.
  outline: { borderColor: colors.border.default, borderWidth: 1, paddingHorizontal: 11 },
  filled: {
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderWidth: 1,
    paddingHorizontal: 13,
  },
  on: { backgroundColor: colors.accent.subtle, paddingHorizontal: 12 },
  off: { paddingHorizontal: 12 },
  pressed: { backgroundColor: colors.border.subtle },
  sm: { height: HEIGHT.sm },
  md: { height: HEIGHT.md },
  label: { color: colors.text.primary, fontFamily: fonts.extrabold },
  labelSm: { fontSize: 13, lineHeight: 18 },
  labelMd: { fontSize: 14, lineHeight: 19 },
  onInk: { color: colors.accent.text },
  offInk: { color: colors.text.secondary },
});

interface PillLook {
  readonly body: ViewStyle;
  readonly ink: TextStyle | null;
}

/** Fill, ring and ink per appearance; a toggle reads its selected state. */
function pillLook(appearance: PillAppearance, selected: boolean): PillLook {
  if (appearance === "toggle") {
    return selected
      ? { body: styles.on, ink: styles.onInk }
      : { body: styles.off, ink: styles.offInk };
  }
  return { body: BODY[appearance], ink: null };
}

const SIZE = { sm: styles.sm, md: styles.md } as const satisfies Record<PillSize, ViewStyle>;
const LABEL = { sm: styles.labelSm, md: styles.labelMd } as const satisfies Record<
  PillSize,
  TextStyle
>;
const BODY = { outline: styles.outline, filled: styles.filled } as const satisfies Record<
  Exclude<PillAppearance, "toggle">,
  ViewStyle
>;
