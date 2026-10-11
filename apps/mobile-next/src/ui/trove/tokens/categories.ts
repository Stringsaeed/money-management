import type { ColorValue } from "react-native";

import { colorToken, troveRawColors, type ColorMode, type RawColorKey } from "./colors";

/**
 * Six spending categories in a fixed order, plus Other. A category keeps its color
 * whatever its rank or filter, in every chart, tile and legend. These hues are for
 * identity only, never for status; labels and amounts stay in text tokens.
 */
export const CATEGORY_KEYS = [
  "groceries",
  "dining",
  "transport",
  "bills",
  "shopping",
  "leisure",
  "other",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_TOKENS = {
  groceries: { color: "categoryGroceries", tint: "categoryGroceriesTint" },
  dining: { color: "categoryDining", tint: "categoryDiningTint" },
  transport: { color: "categoryTransport", tint: "categoryTransportTint" },
  bills: { color: "categoryBills", tint: "categoryBillsTint" },
  shopping: { color: "categoryShopping", tint: "categoryShoppingTint" },
  leisure: { color: "categoryLeisure", tint: "categoryLeisureTint" },
  other: { color: "categoryOther", tint: "categoryOtherTint" },
} as const satisfies Record<CategoryKey, { color: RawColorKey; tint: RawColorKey }>;

export interface CategoryColor {
  /** The mark: chart segment, dot, icon on a tinted tile. */
  readonly color: ColorValue;
  /** The tile behind the icon: 14% in light, 20% in dark. */
  readonly tint: ColorValue;
}

const categoryColor = (key: CategoryKey): CategoryColor => ({
  color: colorToken(CATEGORY_TOKENS[key].color),
  tint: colorToken(CATEGORY_TOKENS[key].tint),
});

export const categoryColors = {
  groceries: categoryColor("groceries"),
  dining: categoryColor("dining"),
  transport: categoryColor("transport"),
  bills: categoryColor("bills"),
  shopping: categoryColor("shopping"),
  leisure: categoryColor("leisure"),
  other: categoryColor("other"),
} as const satisfies Record<CategoryKey, CategoryColor>;

/** Raw hex for a category, for SVG fills that need a resolved value. */
export function categoryRawColor(key: CategoryKey, mode: ColorMode): string {
  return troveRawColors[mode][CATEGORY_TOKENS[key].color];
}
