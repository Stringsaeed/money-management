import { StyleSheet, type TextStyle } from "react-native";

import { colors } from "../tokens";

/** Inks printed on paper. They hold the paper-mode values in dark mode too. */
export type ReceiptInk = "ink" | "secondary" | "tertiary" | "accent" | "negative" | "warning";

/** Line sizes: `md` 13/18 on receipts (default), `sm` 12/16 on the compact calc receipt. */
export type ReceiptLineSize = "sm" | "md";

const inks = StyleSheet.create({
  ink: { color: colors.text.onPaper },
  secondary: { color: colors.paper.textSecondary },
  tertiary: { color: colors.paper.textTertiary },
  accent: { color: colors.paper.accentText },
  negative: { color: colors.paper.negative },
  warning: { color: colors.paper.warning },
});

export const RECEIPT_INK = inks satisfies Record<ReceiptInk, TextStyle>;

const sizes = StyleSheet.create({
  sm: { fontSize: 12, lineHeight: 16 },
  md: { fontSize: 13, lineHeight: 18 },
});

export const RECEIPT_LINE_SIZE = sizes satisfies Record<ReceiptLineSize, TextStyle>;
