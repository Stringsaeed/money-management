export const TRACK_PADDING = 2;
export const TRACK_GAP = 2;

export interface SegmentLayout {
  x: number;
  width: number;
}

/** Thumb offset and width for the selected segment of an equal-width track. */
export function segmentLayout(trackWidth: number, count: number, index: number): SegmentLayout {
  if (trackWidth <= 0 || count <= 0) return { x: 0, width: 0 };
  const inner = trackWidth - TRACK_PADDING * 2 - TRACK_GAP * (count - 1);
  const width = inner / count;
  return { x: index * (width + TRACK_GAP), width };
}

export interface FilterState {
  active: boolean;
  count: number;
}

/** The count badge only appears from two filters up; one filter is just "active". */
export function showsFilterCount({ active, count }: FilterState): boolean {
  return active && count >= 2;
}

/** "Filter", "Filter, active" or "Filter, 2 active". */
export function filterAccessibilityLabel(label: string, state: FilterState): string {
  if (!state.active) return label;
  return showsFilterCount(state) ? `${label}, ${state.count} active` : `${label}, active`;
}

/** Plain large headers keep the 34pt display title; slotted ones step down to 28pt per the board. */
export function largeTitleVariant(hasSlots: boolean): "display" | "titleLg" {
  return hasSlots ? "titleLg" : "display";
}
