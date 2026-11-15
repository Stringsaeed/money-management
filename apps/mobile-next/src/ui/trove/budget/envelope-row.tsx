import { StyleSheet, Text as NativeText, View, type TextStyle } from "react-native";

import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "../tokens";
import { EnvelopeBar } from "./envelope-bar";

/** `over` spent past the plan · `rolled` carried from last month · `unknown` no figures yet. */
export type EnvelopeState = "ok" | "over" | "rolled" | "unknown";

export interface EnvelopeRowProps {
  emoji: string;
  name: string;
  /** Mono second line, e.g. "AED 42 a day", "Over by 175", "From last month". */
  sub: string;
  /** Preformatted left figure, e.g. "588", "−175", "—". */
  leftLabel: string;
  /** Preformatted plan line under it, e.g. "of 1,600", "rolled over"; empty hides it. */
  ofLabel: string;
  /** Spent share of the plan, 0…1 (over always fills the bar). */
  progress: number;
  /** Share of the pay period gone, 0…1; null hides the pace tick (rolled, unknown). */
  pace: number | null;
  state?: EnvelopeState;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Whole row, e.g. "Groceries: 588 dirhams left of 1,600". */
  accessibilityLabel: string;
  accessibilityHint?: string;
  testID?: string;
}

/** One envelope on Budget home: emoji, name and pace, the figure left, and a progress bar. */
export function EnvelopeRow({
  emoji,
  name,
  sub,
  leftLabel,
  ofLabel,
  progress,
  pace,
  state = "ok",
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: EnvelopeRowProps) {
  const over = state === "over";
  const content = (
    <>
      <View style={styles.top}>
        <View style={styles.tile}>
          <NativeText allowFontScaling={false} style={styles.emoji}>
            {emoji}
          </NativeText>
        </View>
        <View style={styles.texts}>
          <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
            {name}
          </Text>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            style={[styles.small, over ? styles.negative : styles.tertiary]}
          >
            {sub}
          </NativeText>
        </View>
        <View style={styles.figures}>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            style={[styles.left, LEFT_TONE[state]]}
          >
            {leftLabel}
          </NativeText>
          {ofLabel ? (
            <NativeText
              maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
              numberOfLines={1}
              style={[styles.small, styles.tertiary]}
            >
              {ofLabel}
            </NativeText>
          ) : null}
        </View>
      </View>
      <EnvelopeBar over={over} pace={pace} progress={progress} />
    </>
  );

  if (onPress || onLongPress) {
    return (
      <PressableScale
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onLongPress={onLongPress}
        onPress={onPress}
        pressedStyle={styles.pressed}
        scaleOnPress={false}
        style={styles.row}
        testID={testID}
      >
        {content}
      </PressableScale>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel} accessible style={styles.row} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 12,
    paddingTop: 10,
  },
  // Rows sit flush with no side padding, so a pressed fill would hug the text: dim instead.
  pressed: { opacity: 0.6 },
  top: { alignItems: "center", flexDirection: "row", gap: 12 },
  tile: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderRadius: radius.full,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  emoji: { fontSize: 17, lineHeight: 22 },
  texts: { flex: 1, minWidth: 0 },
  figures: { alignItems: "flex-end" },
  small: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 15 },
  left: { fontFamily: fonts.monoMedium, fontSize: 16, lineHeight: 20 },
  primary: { color: colors.text.primary },
  tertiary: { color: colors.text.tertiary },
  negative: { color: colors.negative.text },
});

const LEFT_TONE = {
  ok: styles.primary,
  over: styles.negative,
  rolled: styles.primary,
  unknown: styles.tertiary,
} as const satisfies Record<EnvelopeState, TextStyle>;
