import { format } from "date-fns";

import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { IconName } from "@/ui/icon";
import { parseDateKey } from "@/utils/date";
import { formatMoneyMinor } from "@/utils/money";

export interface LedgerRowDisplay {
  readonly title: string;
  readonly meta: string;
  readonly amount: string;
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
    readonly showDate?: boolean;
  },
): LedgerRowDisplay {
  const { category, account, toAccount, showDate } = lookups;
  const note = transaction.note.trim();
  const transferTitle = `Transfer to ${toAccount?.name ?? "account"}`;
  const title =
    note || (transaction.kind === "transfer" ? transferTitle : category?.name) || "Transaction";
  const date = parseDateKey(transaction.date);
  const meta = [
    showDate && date ? format(date, "d MMM") : null,
    note && transaction.kind !== "transfer" ? category?.name : null,
    transaction.kind === "transfer" && note ? transferTitle : null,
    account?.name,
  ].filter(Boolean);
  const sign = transaction.kind === "income" ? "+" : transaction.kind === "expense" ? "−" : "";
  return {
    title,
    meta: meta.join(" · "),
    amount: `${sign}${formatMoneyMinor(transaction.amountMinor, transaction.currency)}`,
    tone: transaction.kind,
    emoji: transaction.kind === "transfer" ? null : (category?.icon ?? null),
    tint: category?.color ?? null,
    icon: KIND_ICONS[transaction.kind],
  };
}

export function formatNet(minor: number, currency: string): string {
  const sign = minor > 0 ? "+" : minor < 0 ? "−" : "";
  return `${sign}${formatMoneyMinor(Math.abs(minor), currency)}`;
}
