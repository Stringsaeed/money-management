import {
  StyleSheet,
  Text as NativeText,
  View,
  type ColorValue,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { PressableScale } from "../pressable-scale";
import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "../tokens";
import { BudgetPill } from "./budget-pill";
import { TONE_FILL, TONE_ON, TONE_SUBTLE, type BudgetTone } from "./budget-tone";

/** `md` (default) is Budget home's slot; `sm` the denser kit-board slot. */
export type AttentionSlotSize = "md" | "sm";

export interface AttentionSlotProps {
  /** `warn` bills due, `neg` overspent or short, `accent` payday and household activity. */
  tone: BudgetTone;
  title: string;
  /** Second line, trailing " ›" included when it links, e.g. "+1 more ›". */
  sub?: string;
  /** Makes the second line a link. */
  onSubPress?: () => void;
  subAccessibilityHint?: string;
  /** Disc content: an emoji (🧾)… */
  emoji?: string;
  /** …or a single character in Nunito 800, e.g. "!" or a member's initial "S". */
  glyph?: string;
  /** Member color behind an initial `glyph` (household activity); the glyph turns ink. */
  avatarColor?: ColorValue;
  actionLabel: string;
  onAction: () => void;
  actionAccessibilityHint?: string;
  size?: AttentionSlotSize;
  testID?: string;
}

/**
 * The one thing that needs you on Budget home: a tinted card with a 4pt tone edge, an icon
 * disc, a title and sub line, and a solid action pill.
 */
export function AttentionSlot({
  tone,
  title,
  sub,
  onSubPress,
  subAccessibilityHint,
  emoji,
  glyph,
  avatarColor,
  actionLabel,
  onAction,
  actionAccessibilityHint,
  size = "md",
  testID,
}: AttentionSlotProps) {
  const sized = SIZE[size];
  const subText = sub ? (
    <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={[styles.sub, sized.sub]}>
      {sub}
    </NativeText>
  ) : null;
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="summary"
      style={[styles.slot, sized.slot, TONE_SUBTLE[tone]]}
      testID={testID}
    >
      <View pointerEvents="none" style={[styles.edge, TONE_FILL[tone]]} />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.disc,
          sized.disc,
          avatarColor === undefined ? TONE_FILL[tone] : { backgroundColor: avatarColor },
        ]}
      >
        <NativeText
          allowFontScaling={false}
          style={[
            styles.discText,
            sized.discText,
            avatarColor === undefined ? TONE_ON[tone] : styles.discInk,
          ]}
        >
          {emoji ?? glyph}
        </NativeText>
      </View>
      <View style={styles.texts}>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[styles.title, sized.title]}
        >
          {title}
        </NativeText>
        {subText && onSubPress ? (
          <PressableScale
            accessibilityHint={subAccessibilityHint}
            accessibilityLabel={sub}
            accessibilityRole="link"
            hitSlop={SUB_HIT_SLOP}
            onPress={onSubPress}
            style={styles.subLink}
          >
            {subText}
          </PressableScale>
        ) : (
          subText
        )}
      </View>
      <BudgetPill
        accessibilityHint={actionAccessibilityHint}
        label={actionLabel}
        onPress={onAction}
        size={size === "sm" ? "sm" : "md"}
        tone={tone}
      />
    </View>
  );
}

/** Lifts the 18pt sub line toward the 44pt target without reaching the pill beside it. */
const SUB_HIT_SLOP = { bottom: 12, left: 0, right: 0, top: 6 } as const;

const styles = StyleSheet.create({
  slot: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    overflow: "hidden",
  },
  edge: { bottom: 0, left: 0, position: "absolute", top: 0, width: 4 },
  disc: { alignItems: "center", borderRadius: radius.full, justifyContent: "center" },
  discText: { fontFamily: fonts.extrabold, textAlign: "center" },
  discInk: { color: colors.paper.ink },
  texts: { flex: 1, gap: 1, minWidth: 0 },
  title: { color: colors.text.primary, fontFamily: fonts.extrabold },
  sub: { color: colors.text.secondary, fontFamily: fonts.bold },
  subLink: { alignSelf: "flex-start" },
  slotMd: { gap: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 12, paddingTop: 12 },
  slotSm: { gap: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 10, paddingTop: 10 },
  discMd: { height: 36, width: 36 },
  discSm: { height: 32, width: 32 },
  discTextMd: { fontSize: 18, lineHeight: 24 },
  discTextSm: { fontSize: 16, lineHeight: 22 },
  titleMd: { fontSize: 15, lineHeight: 20 },
  titleSm: { fontSize: 14, lineHeight: 19 },
  subMd: { fontSize: 13, lineHeight: 18 },
  subSm: { fontSize: 12, lineHeight: 16 },
});

interface SizeStyles {
  slot: ViewStyle;
  disc: ViewStyle;
  discText: TextStyle;
  title: TextStyle;
  sub: TextStyle;
}

const SIZE = {
  md: {
    slot: styles.slotMd,
    disc: styles.discMd,
    discText: styles.discTextMd,
    title: styles.titleMd,
    sub: styles.subMd,
  },
  sm: {
    slot: styles.slotSm,
    disc: styles.discSm,
    discText: styles.discTextSm,
    title: styles.titleSm,
    sub: styles.subSm,
  },
} as const satisfies Record<AttentionSlotSize, SizeStyles>;
