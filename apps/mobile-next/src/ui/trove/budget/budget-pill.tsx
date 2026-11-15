import { StyleSheet, Text as NativeText, type TextStyle, type ViewStyle } from "react-native";

import { Icon, type IconName } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, DENSE_MAX_FONT_SCALE, fonts, layout, radius } from "../tokens";
import { TONE_FILL, TONE_ON, TONE_ON_COLOR, type BudgetTone } from "./budget-tone";

/** `sm` 34/13 (kit slot) · `md` 36/14 (Budget home slot) · `lg` 40/15 (retry). */
export type BudgetPillSize = "sm" | "md" | "lg";

export interface BudgetPillProps {
  label: string;
  onPress: () => void;
  tone: BudgetTone;
  size: BudgetPillSize;
  /** Leading 16pt icon, e.g. `retry`. */
  icon?: IconName;
  accessibilityHint?: string;
  testID?: string;
}

/** Solid action pill used by budget cards: tone fill, on-tone Nunito 800 label. */
export function BudgetPill({
  label,
  onPress,
  tone,
  size,
  icon,
  accessibilityHint,
  testID,
}: BudgetPillProps) {
  const height = HEIGHT[size];
  const slop = Math.max(0, (layout.minTouchTarget - height) / 2);
  return (
    <PressableScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={{ bottom: slop, left: 0, right: 0, top: slop }}
      onPress={onPress}
      pressedStyle={tone === "accent" ? styles.pressedAccent : null}
      style={[styles.pill, BODY[size], TONE_FILL[tone]]}
      testID={testID}
    >
      {icon ? <Icon color={TONE_ON_COLOR[tone]} name={icon} size={16} strokeWidth={2.25} /> : null}
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.label, LABEL[size], TONE_ON[tone]]}
      >
        {label}
      </NativeText>
    </PressableScale>
  );
}

const HEIGHT = { sm: 34, md: 36, lg: 40 } as const satisfies Record<BudgetPillSize, number>;

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  sm: { height: HEIGHT.sm, paddingHorizontal: 12 },
  md: { height: HEIGHT.md, paddingHorizontal: 14 },
  lg: { height: HEIGHT.lg, paddingHorizontal: 16 },
  // Warning and negative have no pressed token: they keep the scale feedback only.
  pressedAccent: { backgroundColor: colors.accent.pressed },
  label: { fontFamily: fonts.extrabold },
  labelSm: { fontSize: 13, lineHeight: 18 },
  labelMd: { fontSize: 14, lineHeight: 19 },
  labelLg: { fontSize: 15, lineHeight: 20 },
});

const BODY = { sm: styles.sm, md: styles.md, lg: styles.lg } as const satisfies Record<
  BudgetPillSize,
  ViewStyle
>;

const LABEL = {
  sm: styles.labelSm,
  md: styles.labelMd,
  lg: styles.labelLg,
} as const satisfies Record<BudgetPillSize, TextStyle>;
