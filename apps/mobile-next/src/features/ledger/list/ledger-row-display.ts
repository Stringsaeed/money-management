import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { SystemKind } from "@/ui/trove";
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
  /**
   * System kind tile for rows without a Category (transfers, uncategorised); `null` when the
   * Category's emoji is shown on the neutral tile instead.
   */
  readonly kind: SystemKind | null;
  /** Neutral tile content for rows with a Category emoji; legacy fallback otherwise. */
  readonly tile: string;
  readonly tone: "income" | "expense" | "transfer";
  readonly emoji: string | null;
  readonly tint: string | null;
}

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
    kind: emoji ? null : transaction.kind,
    tile,
    tone: transaction.kind,
    emoji,
    tint: category?.color ?? null,
  };
}
