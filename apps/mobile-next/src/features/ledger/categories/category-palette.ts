import type { CategoryInput } from "@/data/ledger-client";

export interface CategoryColor {
  /** Stored on the category as-is, so it stays a plain hex string. */
  readonly hex: string;
  readonly name: string;
}

export const DEFAULT_CATEGORY_COLOR = "#4a8f69";
export const DEFAULT_CATEGORY_ICON = "🏷️";

export const CATEGORY_COLORS: readonly CategoryColor[] = [
  { hex: DEFAULT_CATEGORY_COLOR, name: "Sage" },
  { hex: "#2f8f8a", name: "Teal" },
  { hex: "#3b7dd8", name: "Blue" },
  { hex: "#6a5acd", name: "Iris" },
  { hex: "#a05cc4", name: "Plum" },
  { hex: "#d9588f", name: "Rose" },
  { hex: "#d46a4c", name: "Terracotta" },
  { hex: "#d9a02b", name: "Honey" },
  { hex: "#8a9a3b", name: "Olive" },
  { hex: "#6b7c85", name: "Slate" },
];

export const CATEGORY_EMOJIS = {
  expense: [
    "🛒",
    "🍽️",
    "☕",
    "🍔",
    "🚗",
    "⛽",
    "🚌",
    "✈️",
    "🏠",
    "💡",
    "📱",
    "🌐",
    "🛍️",
    "👕",
    "💊",
    "🏥",
    "🏋️",
    "🎬",
    "🎮",
    "🎵",
    "📚",
    "🎓",
    "🐾",
    "👶",
    "🎁",
    "💇",
    "🔧",
    "🧾",
    "💳",
    "🏷️",
  ],
  income: [
    "💼",
    "💰",
    "💵",
    "🏦",
    "📈",
    "🪙",
    "💸",
    "🤝",
    "💻",
    "🛠️",
    "🎨",
    "🏠",
    "🏆",
    "🎁",
    "🔁",
    "🌱",
    "🧾",
    "🏷️",
  ],
} as const satisfies Record<CategoryInput["kind"], readonly string[]>;

/** Swatches for the picker, keeping a category's existing custom color selectable. */
export function categoryColorsFor(current: string): readonly CategoryColor[] {
  const known = CATEGORY_COLORS.some((color) => color.hex.toLowerCase() === current.toLowerCase());
  return known ? CATEGORY_COLORS : [{ hex: current, name: "Current" }, ...CATEGORY_COLORS];
}
