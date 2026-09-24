import { ScrollView, StyleSheet } from "react-native";

import type { V2Account, V2Category } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { colors, radii, spacing } from "@/ui/design-tokens";

import { AccountPicker } from "./account-picker";
import { BreadcrumbSeparator } from "./breadcrumb-segment";
import { CategoryPicker } from "./category-picker";
import { DatePicker } from "./date-picker";
import type { TransactionCreateActions } from "./transaction-create-actions";

interface TransactionBreadcrumbsProps extends TransactionCreateActions {
  readonly kind: TransactionInput["kind"];
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly accountId: string;
  readonly toAccountId: string | null;
  readonly categoryId: string | null;
  readonly date: string;
  readonly onAccountChange: (id: string) => void;
  readonly onToAccountChange: (id: string) => void;
  readonly onSelectCategory: (category: V2Category) => void;
  readonly onSelectTransfer: () => void;
  readonly onDateChange: (date: string) => void;
}

export function TransactionBreadcrumbs({
  kind,
  accounts,
  categories,
  accountId,
  toAccountId,
  categoryId,
  date,
  onAccountChange,
  onToAccountChange,
  onSelectCategory,
  onSelectTransfer,
  onDateChange,
  onCreateAccount,
  onCreateCategory,
}: TransactionBreadcrumbsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      <AccountPicker
        title={kind === "transfer" ? "From account" : "Account"}
        placeholder="Account"
        emoji="🏦"
        accounts={accounts}
        selectedId={accountId}
        onChange={onAccountChange}
        emptyMessage="Add an account first so this transaction has somewhere to live."
        onCreateAccount={onCreateAccount}
      />
      <BreadcrumbSeparator />
      <CategoryPicker
        categories={categories}
        selectedId={categoryId}
        isTransfer={kind === "transfer"}
        onSelectCategory={onSelectCategory}
        onSelectTransfer={onSelectTransfer}
        onCreateCategory={onCreateCategory}
      />
      {kind === "transfer" ? (
        <>
          <BreadcrumbSeparator />
          <AccountPicker
            title="To account"
            placeholder="To account"
            emoji="📥"
            accounts={accounts.filter((item) => item.id !== accountId)}
            selectedId={toAccountId}
            onChange={onToAccountChange}
            emptyMessage="Transfers need a second account to move money into."
            onCreateAccount={onCreateAccount}
          />
        </>
      ) : null}
      <BreadcrumbSeparator />
      <DatePicker date={date} onChange={onDateChange} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii["2xl"],
    flexGrow: 0,
    marginHorizontal: spacing[5],
    alignSelf: "flex-start",
  },
  row: { alignItems: "center", gap: spacing[1.5], padding: spacing[2] },
});
