import type { EdgeInsets } from "react-native-safe-area-context";

/** Where the native full-height sheet's top edge sits below the status bar. */
const SHEET_TOP_GAP = 10;
/** Trove Sheet's own content padding: 8 on top, 24 below. */
const SHEET_PADDING_TOP = 8;
const SHEET_PADDING_BOTTOM = 24;
/** Board: the sheet body starts 20pt below its top edge and ends 34pt above the screen bottom. */
const BOARD_TOP = 20;
const BOARD_BOTTOM = 34;

export interface SheetBodyFrame {
  readonly minHeight: number;
  readonly paddingTop: number;
  readonly paddingBottom: number;
}

/**
 * Lets a full-height sheet's body fill the sheet (so the keypad and buttons sit at the bottom, as
 * on the board) inside Trove Sheet's scroll view, and tops up its padding to the board's.
 */
export function sheetBodyFrame(
  windowHeight: number,
  insets: Pick<EdgeInsets, "top" | "bottom">,
): SheetBodyFrame {
  const available =
    windowHeight - insets.top - SHEET_TOP_GAP - SHEET_PADDING_TOP - SHEET_PADDING_BOTTOM;
  return {
    minHeight: Math.max(0, available),
    paddingTop: BOARD_TOP - SHEET_PADDING_TOP,
    paddingBottom: Math.max(0, Math.max(insets.bottom, BOARD_BOTTOM) - SHEET_PADDING_BOTTOM),
  };
}
