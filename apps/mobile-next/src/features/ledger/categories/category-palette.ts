import type { CategoryInput } from "@/data/ledger-client";
import { USER_COLOR_SWATCHES, type EmojiOption } from "@/ui/trove";

/**
 * Colours are stored on the category as plain hex strings. New categories pick from the Trove
 * palette; categories saved with the older palette keep their stored hex, which every tile,
 * preview and emoji cell still renders through `useUserColor` (it accepts any valid hex).
 */
export const DEFAULT_CATEGORY_COLOR = USER_COLOR_SWATCHES[2].hex;
export const DEFAULT_CATEGORY_ICON = "🏷️";

export const CATEGORY_EMOJIS = {
  expense: [
    { glyph: "🛒", name: "Groceries" },
    { glyph: "🍽️", name: "Dining" },
    { glyph: "☕", name: "Coffee" },
    { glyph: "🍔", name: "Fast food" },
    { glyph: "🚗", name: "Car" },
    { glyph: "⛽", name: "Fuel" },
    { glyph: "🚌", name: "Transit" },
    { glyph: "✈️", name: "Travel" },
    { glyph: "🏠", name: "Housing" },
    { glyph: "💡", name: "Utilities" },
    { glyph: "📱", name: "Phone" },
    { glyph: "🌐", name: "Internet" },
    { glyph: "🛍️", name: "Shopping" },
    { glyph: "👕", name: "Clothing" },
    { glyph: "💊", name: "Pharmacy" },
    { glyph: "🏥", name: "Health" },
    { glyph: "🏋️", name: "Fitness" },
    { glyph: "🎬", name: "Movies" },
    { glyph: "🎮", name: "Gaming" },
    { glyph: "🎵", name: "Music" },
    { glyph: "📚", name: "Books" },
    { glyph: "🎓", name: "Education" },
    { glyph: "🐾", name: "Pets" },
    { glyph: "👶", name: "Kids" },
    { glyph: "🎁", name: "Gifts" },
    { glyph: "💇", name: "Beauty" },
    { glyph: "🔧", name: "Repairs" },
    { glyph: "🧾", name: "Bills" },
    { glyph: "💳", name: "Card" },
    { glyph: "🏷️", name: "Other" },
  ],
  income: [
    { glyph: "💼", name: "Salary" },
    { glyph: "💰", name: "Savings" },
    { glyph: "💵", name: "Cash" },
    { glyph: "🏦", name: "Bank" },
    { glyph: "📈", name: "Investments" },
    { glyph: "🪙", name: "Interest" },
    { glyph: "💸", name: "Refunds" },
    { glyph: "🤝", name: "Business" },
    { glyph: "💻", name: "Freelance" },
    { glyph: "🛠️", name: "Side work" },
    { glyph: "🎨", name: "Creative" },
    { glyph: "🏠", name: "Rent" },
    { glyph: "🏆", name: "Bonus" },
    { glyph: "🎁", name: "Gifts" },
    { glyph: "🔁", name: "Recurring" },
    { glyph: "🌱", name: "Growth" },
    { glyph: "🧾", name: "Reimbursements" },
    { glyph: "🏷️", name: "Other" },
  ],
} as const satisfies Record<CategoryInput["kind"], readonly EmojiOption[]>;
