/** Tab bar geometry, in points (Trove "Tab bar v3" artboard). */
export const PILL_HEIGHT = 60;
export const PILL_PADDING = 6;
export const TAB_HEIGHT = 48;
export const TAB_MAX_WIDTH = 50;
/** Narrowest tab on small screens; hitSlop keeps the 44pt touch target. */
export const TAB_MIN_WIDTH = 40;
export const TAB_GAP = 2;
export const ROUND_BUTTON_SIZE = 60;
/** Space between the pill and the round buttons. */
export const SIDE_GAP = 10;
/** Side gap when the screen is too narrow for 44pt tabs at the full gap. */
export const COMPACT_SIDE_GAP = 6;
/** Space between the bar and the safe-area inset. */
export const BOTTOM_OFFSET = 8;
export const BADGE_SIZE = 8;
/** Same box as the 24pt icons. */
export const ICON_BOX = 24;
/**
 * Apple emoji draw larger than their font size when small: 14pt draws a 17.3pt glyph, the same
 * as the icons' art and the Add +. Measured on device; the board's 26px emoji drew ≈25.5pt.
 */
export const SCOPE_EMOJI_SIZE = 14;
/**
 * Line height that centres the 14pt emoji on the icons' optical centre. Text snaps to device
 * pixels; 65/3pt (65px at 3x) lands it on the same pixel row as the icons.
 */
export const SCOPE_EMOJI_LINE_HEIGHT = 65 / 3;

/** Horizontal travel before a touch on the pill becomes a selector drag; shorter stays a tap. */
export const DRAG_ACTIVATION = 8;
/** Vertical travel that hands the touch back before a drag starts. */
export const DRAG_FAIL_Y = 20;
/** Furthest the selector can be pulled past the first or last tab: it stays inside the pill. */
export const DRAG_OVERSHOOT = PILL_PADDING;
