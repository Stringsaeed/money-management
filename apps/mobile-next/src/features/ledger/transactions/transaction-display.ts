import { format, isToday, isYesterday } from "date-fns";

import type { V2Category } from "@trove/api/v2/contracts";

import { parseDateKey } from "@/utils/date";

const FALLBACK_CATEGORY_EMOJI = "🏷️";

/** Category icons may be emoji or legacy icon slugs ("tag"); only emoji render inline. */
export function categoryEmoji(icon: string | undefined): string {
  if (!icon || /^[\w-]+$/.test(icon)) return FALLBACK_CATEGORY_EMOJI;
  return icon;
}

export function transactionDateLabel(value: string): string {
  const date = parseDateKey(value);
  if (!date) return value;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export interface CategoryChip {
  readonly emoji: string;
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly active: boolean;
}

/** Breadcrumb chip for the category slot, which also represents transfers and "AI pick". */
export function categoryChip(
  category: V2Category | undefined,
  isTransfer: boolean,
  autoCategorize = false,
): CategoryChip {
  if (isTransfer)
    return {
      emoji: "🔁",
      label: "Transfer",
      accessibilityLabel: "Category: Transfer",
      active: true,
    };
  if (autoCategorize)
    return {
      emoji: "✨",
      label: "AI pick",
      accessibilityLabel: "Category: AI picks from the note",
      active: true,
    };
  if (!category)
    return {
      emoji: categoryEmoji(undefined),
      label: "Category",
      accessibilityLabel: "Category: none",
      active: false,
    };
  return {
    emoji: categoryEmoji(category.icon),
    label: category.name,
    accessibilityLabel: `Category: ${category.name}`,
    active: true,
  };
}
