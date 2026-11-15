import { StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";

export interface ReceiptNoteProps {
  /** Printed as given, stars included, e.g. "*** NO BANK CONNECTION NEEDED ***". */
  text: string;
}

/** Centred footer line printed at the bottom of a receipt. */
export function ReceiptNote({ text }: ReceiptNoteProps) {
  return (
    <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.note}>
      {text}
    </NativeText>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.paper.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    // Receipts set 13/18; the note keeps the 18pt line it inherits on the boards.
    lineHeight: 18,
    textAlign: "center",
  },
});
