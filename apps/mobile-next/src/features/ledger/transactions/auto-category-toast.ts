import type { V2CreatedTransaction } from "@trove/api/v2/contracts";

import type { ToastOptions } from "@/ui/trove";

import { categoryEmoji } from "./transaction-display";

const MAX_NOTE_LENGTH = 28;

const shortNote = (note: string): string => {
  const trimmed = note.trim();
  return trimmed.length > MAX_NOTE_LENGTH ? `${trimmed.slice(0, MAX_NOTE_LENGTH - 1)}…` : trimmed;
};

/**
 * Toast announcing where AI filed a new transaction. Every other outcome
 * (unsure, rate limited, unavailable) stays silent: the transaction is saved
 * either way and simply remains uncategorized. `onChange` adds the "Change" action
 * that opens the saved transaction so the person can pick another category.
 */
export function autoCategoryToast(
  created: V2CreatedTransaction,
  onChange?: (transactionId: string) => void,
): ToastOptions | null {
  const categorization = created.autoCategorization;
  if (categorization?.outcome !== "categorized") return null;
  const { category } = categorization;
  return {
    emoji: "✨",
    message: `“${shortNote(created.note)}” filed under ${categoryEmoji(category.icon)} ${category.name}`,
    emphasis: category.name,
    action: onChange ? { label: "Change", onPress: () => onChange(created.id) } : undefined,
  };
}
