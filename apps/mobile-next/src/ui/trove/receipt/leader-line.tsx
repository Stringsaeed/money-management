import { StyleSheet, Text as NativeText, View, type TextStyle, type ViewStyle } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";
import {
  RECEIPT_INK,
  RECEIPT_LINE_SIZE,
  type ReceiptInk,
  type ReceiptLineSize,
} from "./receipt-ink";

export type LeaderLineTone = Extract<ReceiptInk, "ink" | "secondary" | "accent" | "negative">;

export interface LeaderLineProps {
  /** Printed as given; receipts set their labels in caps, e.g. "MONEY YOU HAVE". */
  label: string;
  /** Preformatted figure or copy, e.g. "14,200" or "1 MIN". */
  value: string;
  /** Leading emoji in Nunito, as on the review and wrap-up receipts. */
  emoji?: string;
  /** Step number before the label in paper.textTertiary, e.g. "01" on the intro receipt. */
  prefix?: string;
  /** `bold` sets the label in Plex Mono 600 (a total inside a list). */
  weight?: "regular" | "bold";
  tone?: LeaderLineTone;
  /**
   * `medium` (default) sets the value in Plex Mono 500. `label` matches the label's weight, as
   * on summary lists and the calc receipt.
   */
  valueWeight?: "medium" | "label";
  /** Prints the value on the lime marker, for the total line of a summary list. */
  marker?: boolean;
  /** `md` 13/18 (default) or `sm` 12/16 on the calc receipt. */
  size?: ReceiptLineSize;
  /** Space between the parts: 6 (default), 8 on the intro steps. */
  gap?: 6 | 8;
}

/** Long enough to fill any slip; the line clips it without an ellipsis. */
const LEADER = "·".repeat(64);

/** Receipt line: label, a dotted leader that fills the gap, then the value. */
export function LeaderLine({
  label,
  value,
  emoji,
  prefix,
  weight = "regular",
  tone = "ink",
  valueWeight = "medium",
  marker = false,
  size = "md",
  gap = 6,
}: LeaderLineProps) {
  const labelFont = LABEL_FONT[weight];
  const sizeStyle = RECEIPT_LINE_SIZE[size];
  return (
    <View accessibilityLabel={`${label} ${value}`} accessible style={[styles.row, GAP[gap]]}>
      {emoji ? (
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[styles.emoji, EMOJI_LINE[size]]}
        >
          {emoji}
        </NativeText>
      ) : null}
      {prefix ? (
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[labelFont, sizeStyle, RECEIPT_INK.tertiary]}
        >
          {prefix}
        </NativeText>
      ) : null}
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.label, labelFont, sizeStyle, RECEIPT_INK[tone]]}
      >
        {label}
      </NativeText>
      <NativeText
        ellipsizeMode="clip"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.leader, styles.regular, sizeStyle]}
      >
        {LEADER}
      </NativeText>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[
          VALUE_FONT[valueWeight][weight],
          sizeStyle,
          RECEIPT_INK[tone],
          marker ? styles.marker : null,
        ]}
      >
        {value}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "baseline", flexDirection: "row" },
  gap6: { gap: 6 },
  gap8: { gap: 8 },
  emoji: { fontFamily: fonts.regular, fontSize: 14 },
  emojiSm: { lineHeight: 16 },
  emojiMd: { lineHeight: 18 },
  regular: { fontFamily: fonts.mono },
  medium: { fontFamily: fonts.monoMedium },
  semibold: { fontFamily: fonts.monoSemibold },
  label: { flexShrink: 1 },
  leader: { color: colors.receipt.leader, flex: 1 },
  marker: { backgroundColor: colors.highlight, color: colors.text.onPaper, paddingHorizontal: 3 },
});

type LeaderWeight = NonNullable<LeaderLineProps["weight"]>;

const LABEL_FONT = {
  regular: styles.regular,
  bold: styles.semibold,
} as const satisfies Record<LeaderWeight, TextStyle>;

const VALUE_FONT = {
  medium: { regular: styles.medium, bold: styles.medium },
  label: LABEL_FONT,
} as const satisfies Record<
  NonNullable<LeaderLineProps["valueWeight"]>,
  Record<LeaderWeight, TextStyle>
>;

const GAP = { 6: styles.gap6, 8: styles.gap8 } as const satisfies Record<
  NonNullable<LeaderLineProps["gap"]>,
  ViewStyle
>;

const EMOJI_LINE = { sm: styles.emojiSm, md: styles.emojiMd } as const satisfies Record<
  ReceiptLineSize,
  TextStyle
>;
