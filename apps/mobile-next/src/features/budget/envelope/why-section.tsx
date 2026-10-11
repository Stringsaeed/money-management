import { router } from "expo-router";

import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { Section } from "@/ui/section";

import { TransactionRow } from "../../ledger/transactions/transaction-row";

import { largestTransactions } from "./envelope-model";

interface WhySectionProps {
  readonly transactions: readonly V2Transaction[];
  readonly categories: ReadonlyMap<string, V2Category>;
}

/** O1 "Why": the largest expenses this period. */
export function WhySection({ transactions, categories }: WhySectionProps) {
  const largest = largestTransactions(transactions);
  if (largest.length === 0) return null;
  return (
    <Section title="Why">
      {largest.map((transaction) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          category={transaction.categoryId ? categories.get(transaction.categoryId) : undefined}
          onPress={() => router.push(`/transactions/${transaction.id}`)}
        />
      ))}
    </Section>
  );
}
