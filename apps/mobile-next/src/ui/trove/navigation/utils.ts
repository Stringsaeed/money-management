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
