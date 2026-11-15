import { StyleSheet } from "react-native";

import { colors, fonts } from "@/ui/trove";

/** Row heights from the boards: 52 on Add a big payment, 50 on Mark paid. */
export type FieldRowHeight = 50 | 52;

/** How a field's value is set: Nunito 800 for words, Plex Mono 500 for money and dates. */
export type FieldFont = "words" | "money";

/** Shared row and type styles for the B2/B3 field rows. */
export const fieldStyles = StyleSheet.create({
  // The card's 1pt ring takes no space on the board; 16pt from its outer edge.
  row: { alignItems: "center", flexDirection: "row", gap: 10, paddingHorizontal: 15 },
  h50: { minHeight: 50 },
  h52: { minHeight: 52 },
  pressed: { backgroundColor: colors.fill.neutral },
  label: { color: colors.text.secondary, fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 },
  fill: { flex: 1 },
  value: { color: colors.text.primary, fontSize: 15, lineHeight: 20 },
  end: { textAlign: "right" },
  words: { fontFamily: fonts.extrabold },
  money: { fontFamily: fonts.monoMedium },
});

export const HEIGHT = { 50: fieldStyles.h50, 52: fieldStyles.h52 } as const;
export const FONT = { words: fieldStyles.words, money: fieldStyles.money } as const;

/** A fixed label column (Add a big payment), or a label that fills the row (Mark paid). */
export function fieldLabelStyle(labelWidth: number | undefined) {
  return [fieldStyles.label, labelWidth === undefined ? fieldStyles.fill : { width: labelWidth }];
}
