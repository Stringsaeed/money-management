import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import type { V2Account, V2Category } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { Breadcrumb, DateSheet, layout } from "@/ui/trove";

import { AccountPicker } from "./account-picker";
import { transactionBreadcrumbSegments } from "./breadcrumb-segments";
import { CategoryPicker } from "./category-picker";
import type { TransactionCreateActions } from "./transaction-create-actions";
import type { TransactionPicker } from "./transaction-picker";

interface TransactionBreadcrumbsProps extends TransactionCreateActions {
  readonly kind: TransactionInput["kind"];
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly accountId: string;
  readonly toAccountId: string | null;
  readonly categoryId: string | null;
  readonly autoCategorize: boolean;
  readonly date: string;
  readonly onAccountChange: (id: string) => void;
  readonly onToAccountChange: (id: string) => void;
  readonly onSelectCategory: (category: V2Category) => void;
  readonly onSelectTransfer: () => void;
  readonly onSelectAutoCategory?: (kind: V2Category["kind"]) => void;
  readonly onDateChange: (date: string) => void;
}

/** The path under the title (account › category › [to account] › date) and the pickers it opens. */
export function TransactionBreadcrumbs({
  kind,
  accounts,
  categories,
  accountId,
  toAccountId,
  categoryId,
  autoCategorize,
  date,
  onAccountChange,
  onToAccountChange,
  onSelectCategory,
  onSelectTransfer,
  onSelectAutoCategory,
  onDateChange,
  onCreateAccount,
  onCreateCategory,
}: TransactionBreadcrumbsProps) {
  const [open, setOpen] = useState<TransactionPicker | null>(null);
  const isTransfer = kind === "transfer";
  const close = (picker: TransactionPicker) => () =>
    setOpen((current) => (current === picker ? null : current));

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.bar}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
      >
        <Breadcrumb
          accessibilityLabel="Transaction details"
          segments={transactionBreadcrumbSegments({
            isTransfer,
            accounts,
            categories,
            accountId,
            toAccountId,
            categoryId,
            autoCategorize,
            date,
            open,
            onOpen: setOpen,
          })}
        />
      </ScrollView>
      <AccountPicker
        open={open === "account"}
        onDismiss={close("account")}
        title={isTransfer ? "From account" : "Account"}
        accounts={accounts}
        selectedId={accountId}
        onChange={onAccountChange}
        emptyMessage="Add an account first so this transaction has somewhere to live."
        onCreateAccount={onCreateAccount}
      />
      <CategoryPicker
        open={open === "category"}
        onDismiss={close("category")}
        categories={categories}
        selectedId={categoryId}
        isTransfer={isTransfer}
        autoKind={autoCategorize && !isTransfer ? kind : null}
        onSelectCategory={onSelectCategory}
        onSelectTransfer={onSelectTransfer}
        onSelectAuto={onSelectAutoCategory}
        onCreateCategory={onCreateCategory}
      />
      <AccountPicker
        open={open === "toAccount"}
        onDismiss={close("toAccount")}
        title="To account"
        accounts={accounts.filter((item) => item.id !== accountId)}
        selectedId={toAccountId}
        onChange={onToAccountChange}
        emptyMessage="Transfers need a second account to move money into."
        onCreateAccount={onCreateAccount}
      />
      <DateSheet
        open={open === "date"}
        onDismiss={close("date")}
        value={date}
        onChange={onDateChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  bar: { paddingHorizontal: layout.screenGutter },
});
