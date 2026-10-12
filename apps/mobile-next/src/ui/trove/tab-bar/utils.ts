import { layout, space } from "../tokens";
import {
  COMPACT_SIDE_GAP,
  PILL_PADDING,
  ROUND_BUTTON_SIZE,
  SIDE_GAP,
  TAB_GAP,
  TAB_MAX_WIDTH,
  TAB_MIN_WIDTH,
} from "./constants";
import type { TabBarScope } from "./types";

const SCREEN_MARGIN = space[1];

export interface TabBarLayout {
  tabWidth: number;
  sideGap: number;
}

const chromeWidth = (tabCount: number, roundButtons: number, sideGap: number) =>
  SCREEN_MARGIN * 2 +
  (ROUND_BUTTON_SIZE + sideGap) * roundButtons +
  PILL_PADDING * 2 +
  TAB_GAP * (tabCount - 1);

const fitFor = (windowWidth: number, tabCount: number, roundButtons: number, sideGap: number) =>
  Math.floor((windowWidth - chromeWidth(tabCount, roundButtons, sideGap)) / tabCount);

/**
 * Tab width and side gap: the board's 50pt tabs where the screen allows, shrinking to the 44pt
 * touch target; on narrow screens (≈320pt) the side gap tightens and tabs go down to 40pt, with
 * hitSlop restoring the 44pt target, so the pill and its round buttons still fit.
 */
export function tabBarLayout(
  windowWidth: number,
  tabCount: number,
  roundButtons = 2,
): TabBarLayout {
  if (tabCount <= 0) return { tabWidth: TAB_MAX_WIDTH, sideGap: SIDE_GAP };
  const fit = fitFor(windowWidth, tabCount, roundButtons, SIDE_GAP);
  if (fit >= layout.minTouchTarget) {
    return { tabWidth: Math.min(TAB_MAX_WIDTH, fit), sideGap: SIDE_GAP };
  }
  const compact = fitFor(windowWidth, tabCount, roundButtons, COMPACT_SIDE_GAP);
  return {
    tabWidth: Math.max(TAB_MIN_WIDTH, Math.min(layout.minTouchTarget, compact)),
    sideGap: COMPACT_SIDE_GAP,
  };
}

/** Horizontal hitSlop that brings a narrow tab back to the 44pt touch target. */
export function tabHitSlop(tabWidth: number): number {
  return Math.max(0, Math.ceil((layout.minTouchTarget - tabWidth) / 2));
}

/** Left offset of tab `index` inside the pill's padded content box; 0 when none is active. */
export function indicatorOffset(index: number, tabWidth: number): number {
  return index < 0 ? 0 : index * (tabWidth + TAB_GAP);
}

/** The board's spoken name for the scope button. */
export function scopeButtonLabel(scope: TabBarScope): string {
  return `${scope === "household" ? "Household" : "Personal"} budget. Switch ledger or open settings`;
}

/** The board's scope glyph. */
export function scopeEmoji(scope: TabBarScope): string {
  return scope === "household" ? "🏠" : "👤";
}

/** Round buttons beside the pill: Add always, plus scope when its handler exists. */
export function roundButtonCount(onScopePress?: () => void): number {
  return onScopePress ? 2 : 1;
}
