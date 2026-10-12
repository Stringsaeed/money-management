/**
 * UI-thread math for the draggable tab selector. Offsets are the selector's left edge inside
 * the pill's padded content box; `step` is one tab plus the gap.
 */

/** iOS scroll-view resistance: pulls past an edge travel less and less, never beyond `limit`. */
export function rubberBand(offset: number, max: number, limit: number): number {
  "worklet";
  const resist = (over: number) => (over * limit * 0.55) / (limit + 0.55 * over);
  if (offset < 0) return -resist(-offset);
  if (offset > max) return max + resist(offset - max);
  return offset;
}

/** The tab whose slot is nearest to `offset`, clamped to the bar. */
export function nearestTab(offset: number, step: number, tabCount: number): number {
  "worklet";
  if (step <= 0 || tabCount <= 0) return 0;
  return Math.min(tabCount - 1, Math.max(0, Math.round(offset / step)));
}
