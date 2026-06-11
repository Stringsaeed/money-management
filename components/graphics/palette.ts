import { useColorScheme } from "@/hooks/use-color-scheme";

// Mirrors the Garden Ledger palette in global.css — SVG props can't read CSS variables.
const light = {
  ink: "#2c5f47",
  sage: "#4a8f69",
  terracotta: "#d46a4c",
  surfaceDim: "#d9e4db",
};

const dark = {
  ink: "#d6e8dc",
  sage: "#6fb58a",
  terracotta: "#e0816a",
  surfaceDim: "#223029",
};

export type GraphicPalette = typeof light;

export function useGraphicPalette(): GraphicPalette {
  return useColorScheme() === "dark" ? dark : light;
}
