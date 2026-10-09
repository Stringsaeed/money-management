/** Column chart geometry, in points. */
export const COLUMN_PLOT_HEIGHT = 140;
/** Room above the plot so the tooltip over the tallest column stays inside the chart. */
export const COLUMN_TOP_INSET = 16;
/** Date row under the baseline. */
export const COLUMN_LABEL_ROW = 24;
export const COLUMN_TOTAL_HEIGHT = COLUMN_TOP_INSET + COLUMN_PLOT_HEIGHT + COLUMN_LABEL_ROW;
/** Right gutter holding the y-axis tick labels. */
export const COLUMN_Y_GUTTER = 40;

/** Balance chart geometry, in points. */
export const BALANCE_TOOLTIP_ROW = 32;
export const BALANCE_PLOT_HEIGHT = 124;
export const BALANCE_LABEL_ROW = 24;
export const BALANCE_TOTAL_HEIGHT = BALANCE_TOOLTIP_ROW + BALANCE_PLOT_HEIGHT + BALANCE_LABEL_ROW;
/** Keeps the end dots and their 2pt rings inside the SVG. */
export const BALANCE_PAD_X = 6;
