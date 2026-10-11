import type { V2Account, V2Category } from "@trove/api/v2/contracts";

import type { BreadcrumbSegmentSpec } from "@/ui/trove";

import { accountTypeOption } from "../accounts/account-display";

import { categoryChip, transactionDateLabel } from "./transaction-display";
import type { TransactionPicker } from "./transaction-picker";

interface BreadcrumbSegmentsInput {
  readonly isTransfer: boolean;
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly accountId: string;
  readonly toAccountId: string | null;
  readonly categoryId: string | null;
  readonly autoCategorize: boolean;
  readonly date: string;
  /** The picker that is currently open. */
  readonly open: TransactionPicker | null;
  readonly onOpen: (picker: TransactionPicker) => void;
}

const stateOf = (picker: TransactionPicker, open: TransactionPicker | null, isSet: boolean) => {
  if (open === picker) return "active";
  return isSet ? "set" : "unset";
};

interface AccountSegmentInput {
  readonly picker: "account" | "toAccount";
  readonly key: string;
  readonly title: string;
  readonly placeholder: string;
  readonly fallbackEmoji: string;
  readonly account: V2Account | undefined;
  readonly input: BreadcrumbSegmentsInput;
}

function accountSegment({
  picker,
  key,
  title,
  placeholder,
  fallbackEmoji,
  account,
  input,
}: AccountSegmentInput): BreadcrumbSegmentSpec {
  return {
    key,
    emoji: account ? accountTypeOption(account.type).emoji : fallbackEmoji,
    label: account?.name ?? placeholder,
    accessibilityLabel: `${title}: ${account?.name ?? "not selected"}`,
    state: stateOf(picker, input.open, account !== undefined),
    onPress: () => input.onOpen(picker),
  };
}

/** Account › category › [to account] › date, as the Trove Breadcrumb's segment specs. */
export function transactionBreadcrumbSegments(input: BreadcrumbSegmentsInput) {
  const find = (id: string | null) => input.accounts.find((item) => item.id === id);
  const chip = categoryChip(
    input.categories.find((item) => item.id === input.categoryId),
    input.isTransfer,
    input.autoCategorize,
  );
  const dateLabel = transactionDateLabel(input.date);
  const segments: BreadcrumbSegmentSpec[] = [
    accountSegment({
      picker: "account",
      key: "account",
      title: input.isTransfer ? "From account" : "Account",
      placeholder: "Account",
      fallbackEmoji: "🏦",
      account: find(input.accountId),
      input,
    }),
    {
      key: "category",
      emoji: chip.emoji,
      label: chip.label,
      accessibilityLabel: chip.accessibilityLabel,
      state: stateOf("category", input.open, chip.active),
      onPress: () => input.onOpen("category"),
    },
  ];
  if (input.isTransfer)
    segments.push(
      accountSegment({
        picker: "toAccount",
        key: "to-account",
        title: "To account",
        placeholder: "To account",
        fallbackEmoji: "📥",
        account: find(input.toAccountId),
        input,
      }),
    );
  segments.push({
    key: "date",
    emoji: "📅",
    label: dateLabel,
    accessibilityLabel: `Date: ${dateLabel}`,
    state: stateOf("date", input.open, true),
    onPress: () => input.onOpen("date"),
  });
  return segments;
}
