import type { V2Category } from "@trove/api/v2/contracts";

import { categoryEmoji } from "@/features/ledger/categories/category-emoji";

import type { SetupItem } from "./setup-items";
import { SETUP_PRESETS } from "./setup-presets";

const FALLBACK = categoryEmoji(undefined);

/** The preset emoji for an item name, e.g. 🛒 for Groceries; null for custom items. */
export function presetEmoji(name: string): string | null {
  const key = name.trim().toLowerCase();
  return SETUP_PRESETS.find((preset) => preset.name.toLowerCase() === key)?.emoji ?? null;
}

/**
 * The emoji on an item's chip and amount row: its Category's own emoji, else the preset's,
 * else the plain tag every uncategorised row shows.
 */
export function itemEmoji(item: SetupItem, categories: readonly V2Category[]): string {
  const category = item.categoryId
    ? categories.find((candidate) => candidate.id === item.categoryId)
    : undefined;
  const own = category ? categoryEmoji(category.icon) : FALLBACK;
  if (own !== FALLBACK) return own;
  return presetEmoji(item.name) ?? FALLBACK;
}
