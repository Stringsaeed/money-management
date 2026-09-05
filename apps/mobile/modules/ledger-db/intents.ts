import type { CommandEnvelope } from "@trove/protocol";

import type {
  IntentReceipt,
  LedgerTransaction,
  NewTransactionInput,
  RefundInput,
  TransactionEdit,
} from "./types";

export interface MintContext {
  readonly householdId: string;
  readonly newId: () => string;
  readonly now: () => string;
}

export interface MintedCreate {
  readonly receipt: IntentReceipt;
  readonly command: CommandEnvelope;
}

export const mintCreate = (ctx: MintContext, input: NewTransactionInput): MintedCreate => {
  const id = ctx.newId();
  const commandId = ctx.newId();
  return {
    receipt: { id, commandId },
    command: {
      commandId,
      householdId: ctx.householdId,
      kind: "transaction.create",
      issuedAt: ctx.now(),
      payload: {
        id,
        type: input.type,
        amountMinor: input.amount,
        date: input.date,
        accountId: input.accountId,
        toAccountId: input.toAccountId,
        categoryId: input.categoryId,
        description: input.description,
        originalAmountMinor: input.originalAmount,
        originalCurrency: input.originalCurrency,
        exchangeRate: input.exchangeRate,
        isRecurring: input.isRecurring ?? false,
      },
    },
  };
};

export const mintEdit = (
  ctx: MintContext,
  row: LedgerTransaction,
  changes: TransactionEdit,
): CommandEnvelope => ({
  commandId: ctx.newId(),
  householdId: ctx.householdId,
  kind: "transaction.edit",
  issuedAt: ctx.now(),
  payload: {
    transactionId: row.id,
    ...(changes.type !== undefined && { type: changes.type }),
    ...(changes.amount !== undefined && { amountMinor: changes.amount }),
    ...(changes.date !== undefined && { date: changes.date }),
    ...(changes.accountId !== undefined && { accountId: changes.accountId }),
    ...(changes.toAccountId !== undefined && { toAccountId: changes.toAccountId }),
    ...(changes.categoryId !== undefined && { categoryId: changes.categoryId }),
    ...(changes.description !== undefined && { description: changes.description }),
  },
  preconditions: [{ entityId: row.id, expectedVersion: row.version }],
});

export const mintRemove = (ctx: MintContext, row: LedgerTransaction): CommandEnvelope => ({
  commandId: ctx.newId(),
  householdId: ctx.householdId,
  kind: "transaction.remove",
  issuedAt: ctx.now(),
  payload: { transactionId: row.id },
  preconditions: [{ entityId: row.id, expectedVersion: row.version }],
});

export const mintRefund = (ctx: MintContext, input: RefundInput): MintedCreate => {
  const id = ctx.newId();
  const commandId = ctx.newId();
  return {
    receipt: { id, commandId },
    command: {
      commandId,
      householdId: ctx.householdId,
      kind: "refund.link",
      issuedAt: ctx.now(),
      payload: {
        transactionId: id,
        originalTransactionId: input.originalTransactionId,
        depositAccountId: input.depositAccountId,
        currency: input.currency,
        amountMinor: input.amount,
        date: input.date,
      },
    },
  };
};
