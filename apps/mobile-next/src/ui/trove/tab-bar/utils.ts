import { layout, space } from "../tokens";
import { PILL_PADDING, ROUND_BUTTON_SIZE, SIDE_GAP, TAB_GAP, TAB_MAX_WIDTH } from "./constants";

const SCREEN_MARGIN = space[1];

/**
 * Tab width: 56pt where the screen allows, shrinking (never below the 44pt touch target)
 * so the pill and both round buttons fit next to each other.
 */
export function tabWidthFor(windowWidth: number, tabCount: number): number {
  if (tabCount <= 0) return TAB_MAX_WIDTH;
  const chrome =
    SCREEN_MARGIN * 2 +
    ROUND_BUTTON_SIZE * 2 +
    SIDE_GAP * 2 +
    PILL_PADDING * 2 +
    TAB_GAP * (tabCount - 1);
  const fit = Math.floor((windowWidth - chrome) / tabCount);
  return Math.max(layout.minTouchTarget, Math.min(TAB_MAX_WIDTH, fit));
}

/** Left offset of tab `index` inside the pill's padded content box; -1 when none is active. */
export function indicatorOffset(index: number, tabWidth: number): number {
  return index < 0 ? 0 : index * (tabWidth + TAB_GAP);
}
