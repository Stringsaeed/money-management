import { StyleSheet, Text as NativeText } from "react-native";

import {
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  Icon,
  PressableScale,
  radius,
  type IconName,
} from "@/ui/trove";

export type SearchChipTail = "menu" | "remove" | null;

interface SearchFilterChipProps {
  readonly label: string;
  /** A Trove icon, or the category's own emoji. */
  readonly icon?: IconName;
  readonly emoji?: string;
  readonly on: boolean;
  /** `menu` opens a picker (▾); `remove` clears the filter (✕). */
  readonly tail: SearchChipTail;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
}

const TAIL_GLYPH = { menu: "▾", remove: "✕" } as const;
/** Board chips are 36pt with 12pt sides; the idle ring is a border, so it takes its point. */
const PAD_X = 12;

/** One of the search filters: accent-filled while applied, ringed and quiet while not. */
export function SearchFilterChip({
  label,
  icon,
  emoji,
  on,
  tail,
  accessibilityLabel,
  onPress,
}: SearchFilterChipProps) {
  const ink = on ? colors.accent.on : colors.text.primary;
  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      hitSlop={{ top: 4, bottom: 4 }}
      onPress={onPress}
      style={[styles.chip, on ? styles.on : styles.off]}
    >
      {emoji ? (
        <NativeText
          accessibilityElementsHidden
          allowFontScaling={false}
          importantForAccessibility="no"
          style={styles.emoji}
        >
          {emoji}
        </NativeText>
      ) : icon ? (
        <Icon color={ink} name={icon} size={16} />
      ) : null}
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.label, { color: ink }]}
      >
        {label}
      </NativeText>
      {tail ? (
        <NativeText
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.tail, { color: ink }]}
        >
          {TAIL_GLYPH[tail]}
        </NativeText>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 6,
    height: 36,
  },
  on: { backgroundColor: colors.accent.fill, paddingHorizontal: PAD_X },
  off: { borderColor: colors.border.default, borderWidth: 1, paddingHorizontal: PAD_X - 1 },
  emoji: { fontSize: 14, lineHeight: 18 },
  label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 },
  tail: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 },
});
