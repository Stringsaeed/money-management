import type {
  LedgerTransactionResource,
  NewRefund,
  NewTransaction,
  TransactionUpdate,
} from "@/modules/ledger-data-source/contract";
import type { TransactionQueryFilters } from "@/modules/ledger-cache";

import {
  applyLedgerFilters,
  dateRangeOf,
  pageTransactions,
  queryFiltersToLedger,
  summarizeTransactions,
  toEditDate,
} from "./filters";
import type { SyncedTransactionLedger } from "./ledger";
import type { NewTransactionInput, TransactionEdit } from "./types";

export const toLedgerTransactionResource = (
  ledger: SyncedTransactionLedger,
): LedgerTransactionResource => {
  const listed = (filters: TransactionQueryFilters = {}) =>
    applyLedgerFilters(ledger.rows(), queryFiltersToLedger(filters));

  return {
    list: async (filters) => listed(filters),
    get: async (id) => listed({}).find((row) => row.id === id),
    dateRange: async () => dateRangeOf(ledger.rows()),
    monthSummary: async (year, month, accountId) =>
      summarizeTransactions(listed({ year, month, accountId })),
    page: async (options) => pageTransactions(ledger.rows(), options),
    create: (data) => ledger.intents.create(toCreateInput(data)),
    update: async (id, data) => ledger.intents.edit(id, toEditInput(data)),
    delete: (id) => ledger.intents.remove(id),
    recordCardPayment: async () => {
      throw new Error("Card payments need the budget cutover before they can be recorded.");
    },
    linkRefund: (data) => ledger.intents.linkRefund(toRefundInput(data)),
  };
};

const toCreateInput = (data: NewTransaction): NewTransactionInput => ({
  type: data.type,
  amount: data.amount,
  date: data.date,
  accountId: data.accountId,
  toAccountId: data.toAccountId,
  categoryId: data.categoryId,
  description: data.description,
  originalAmount: data.originalAmount,
  originalCurrency: data.originalCurrency,
  exchangeRate: data.exchangeRate,
  isRecurring: data.isRecurring,
});

const toEditInput = (data: TransactionUpdate): TransactionEdit => ({
  ...(data.type !== undefined && { type: data.type }),
  ...(data.amount !== undefined && { amount: data.amount }),
  ...(data.date !== undefined && { date: toEditDate(data.date) }),
  ...(data.accountId !== undefined && { accountId: data.accountId }),
  ...(data.toAccountId !== undefined && { toAccountId: data.toAccountId }),
  ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
  ...(data.description !== undefined && { description: data.description }),
});

const toRefundInput = (data: NewRefund) => ({
  originalTransactionId: data.originalTransactionId,
  depositAccountId: data.depositAccountId,
  currency: data.currency,
  amount: data.amountMinor,
  date: data.date,
});
