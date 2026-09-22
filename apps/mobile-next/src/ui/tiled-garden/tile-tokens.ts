/**
 * Fixed colors for the Tiled Garden surfaces.
 *
 * These surfaces are intentionally the same in light and dark appearance. The
 * Home composition uses them as editorial accents while the app background and
 * surrounding controls continue to use the canonical native-aware tokens.
 */
export const tileColors = {
  cream: "#F5EBD6",
  olive: "#CDD27A",
  pink: "#E5A4B7",
  ink: "#25231D",
  muted: "#746D60",
  grout: "#D5C9B1",
  white: "#FFFDF7",
} as const;

export const tileForegrounds = {
  cream: tileColors.ink,
  olive: tileColors.ink,
  pink: tileColors.ink,
} as const;

export const tileChartColors = {
  balance: "#354722",
  income: "#40562D",
  expense: "#B95770",
  area: "#BFCB83",
  grid: "#D8CFBC",
} as const;

export type TileTone = keyof typeof tileForegrounds;
