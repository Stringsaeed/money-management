import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { IconName } from "@/ui/icon";
import { formatMoneyMinor } from "@/utils/money";

import { transactionTileIcon } from "../transactions/transaction-display";

export interface LedgerRowDisplay {
  readonly title: string;
  readonly meta: string;
  /** Pre-formatted signed amount, kept for spoken labels and plain-text consumers. */
  readonly amount: string;
  /** Signed minor units for `Amount`: expense negative, income positive. */
  readonly signedMinor: number;
  readonly currency: string;
  /** Transfers carry no sign; spending and income always do. */
  readonly signDisplay: "always" | "never";
  /** Trove tile content: the Category emoji, the transfer emoji, or the "other" icon. */
  readonly tile: string;
  readonly tone: "income" | "expense" | "transfer";
  readonly emoji: string | null;
  readonly tint: string | null;
  readonly icon: IconName;
}

const KIND_ICONS = {
  income: "arrow-down-left",
  expense: "arrow-up-right",
  transfer: "arrows-left-right",
} satisfies Record<V2Transaction["kind"], IconName>;

// oxlint-disable-next-line complexity -- one row maps kind, category, account, and date into copy.
export function ledgerRowDisplay(
  transaction: V2Transaction,
  lookups: {
    readonly category?: V2Category;
    readonly account?: V2Account;
    readonly toAccount?: V2Account;
  },
): LedgerRowDisplay {
  const { category, account, toAccount } = lookups;
  const note = transaction.note.trim();
  const transferTitle = `Transfer to ${toAccount?.name ?? "account"}`;
  const title =
    note || (transaction.kind === "transfer" ? transferTitle : category?.name) || "Transaction";
  const meta = [
    note && transaction.kind !== "transfer" ? category?.name : null,
    transaction.kind === "transfer" && note ? transferTitle : null,
    account?.name,
  ].filter(Boolean);
  const sign = transaction.kind === "income" ? "+" : transaction.kind === "expense" ? "−" : "";
  const emoji = transaction.kind === "transfer" ? null : (category?.icon ?? null);
  const tile = transactionTileIcon(transaction.kind, emoji);
  return {
    title,
    meta: meta.join(" · "),
    amount: `${sign}${formatMoneyMinor(transaction.amountMinor, transaction.currency)}`,
    signedMinor:
      transaction.kind === "expense" ? -transaction.amountMinor : transaction.amountMinor,
    currency: transaction.currency,
    signDisplay: transaction.kind === "transfer" ? "never" : "always",
    tile,
    tone: transaction.kind,
    emoji,
    tint: category?.color ?? null,
    icon: KIND_ICONS[transaction.kind],
  };
}
