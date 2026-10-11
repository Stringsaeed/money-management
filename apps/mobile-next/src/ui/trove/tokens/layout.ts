/** 4pt spacing scale. Screen gutter space[5] · card padding space[4] · section gap space[8]. */
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Controls are always `full`. Fixed radii are for containers only. */
export const radius = {
  none: 0,
  /** Chart bar tops */
  xs: 4,
  /** Checkbox, icon tiles */
  sm: 8,
  /** Banners, emoji tiles */
  md: 12,
  /** Cards, list groups */
  lg: 16,
  /** Sheets, dialogs */
  xl: 24,
  full: 999,
} as const;

export const layout = {
  screenGutter: space[5],
  cardPadding: space[4],
  sectionGap: space[8],
  listRowMinHeight: 64,
  /** Minimum touch target; smaller visuals reach it with hitSlop. */
  minTouchTarget: 44,
} as const;
