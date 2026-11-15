import type { V2Account, V2Category } from "@trove/api/v2/contracts";

import { accountTypeOption } from "../../ledger/accounts/account-display";
import { transactionDateLabel } from "../../ledger/transactions/transaction-display";
import { ownCategoryEmoji } from "../envelope-emoji";

export interface MetaChipCopy {
  readonly emoji: string;
  readonly label: string;
  readonly accessibilityLabel: string;
}

export interface QuickAddMetaCopy {
  readonly account: MetaChipCopy;
  readonly date: MetaChipCopy;
  /** Only when the envelope maps to several Categories; one needs no question. */
  readonly category: MetaChipCopy | null;
  readonly note: MetaChipCopy;
}

interface MetaInput {
  readonly account: V2Account | null;
  readonly date: string;
  readonly category: V2Category | null;
  readonly categoryCount: number;
  readonly note: string;
}

function accountCopy(account: V2Account | null): MetaChipCopy {
  if (!account) {
    return { emoji: "💳", label: "Paid with", accessibilityLabel: "Paid with: not chosen" };
  }
  return {
    emoji: accountTypeOption(account.type).emoji,
    label: account.name,
    accessibilityLabel: `Paid with: ${account.name}`,
  };
}

function categoryCopy(category: V2Category | null, count: number): MetaChipCopy | null {
  if (!category || count < 2) return null;
  return {
    emoji: ownCategoryEmoji(category) ?? "🏷️",
    label: category.name,
    accessibilityLabel: `Category: ${category.name}`,
  };
}

/** What each of Quick add's meta chips prints and says. */
export function quickAddMetaCopy(input: MetaInput): QuickAddMetaCopy {
  const dateLabel = transactionDateLabel(input.date);
  const note = input.note.trim();
  return {
    account: accountCopy(input.account),
    date: { emoji: "📅", label: dateLabel, accessibilityLabel: `Date: ${dateLabel}` },
    category: categoryCopy(input.category, input.categoryCount),
    note: note
      ? { emoji: "📝", label: note, accessibilityLabel: `Note: ${note}` }
      : { emoji: "📝", label: "Note", accessibilityLabel: "Add a note" },
  };
}
