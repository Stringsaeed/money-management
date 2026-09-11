import type { CommandEnvelope } from "@trove/protocol";

import type { SyncedLedgerBinding } from "@/modules/ledger-data-source/provider";

import type {
  IntentReceipt,
  LedgerTransaction,
  NewTransactionInput,
  RefundInput,
  PowerSyncTransactionRow,
  TransactionEdit,
} from "./types";

export interface MintContext {
  readonly binding: SyncedLedgerBinding;
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
      scope: ctx.binding.scope,
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
  scope: ctx.binding.scope,
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
  scope: ctx.binding.scope,
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
      scope: ctx.binding.scope,
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

export interface PowerSyncMintContext extends MintContext {
  readonly userId: string;
  readonly accountCurrency: (accountId: string) => string;
}

export interface MintedPowerSyncCreate extends MintedCreate {
  readonly row: PowerSyncTransactionRow;
}

export interface MintedPowerSyncUpdate {
  readonly command: CommandEnvelope;
  readonly changes: Partial<PowerSyncTransactionRow>;
}

export interface MintedPowerSyncDelete {
  readonly command: CommandEnvelope;
  readonly id: string;
}

export const mintPowerSyncCreate = (
  ctx: PowerSyncMintContext,
  input: NewTransactionInput,
): MintedPowerSyncCreate => {
  const minted = mintCreate(ctx, input);
  const timestamp = minted.command.issuedAt ?? ctx.now();
  return {
    ...minted,
    row: {
      id: minted.receipt.id,
      ledger_id: ctx.binding.ledgerId,
      household_id: ctx.binding.householdId,
      type: input.type,
      amount_minor: input.amount,
      currency: ctx.accountCurrency(input.accountId),
      original_amount_minor: input.originalAmount ?? null,
      original_currency: input.originalCurrency ?? null,
      exchange_rate: input.exchangeRate ?? null,
      date: input.date,
      account_id: input.accountId,
      to_account_id: input.toAccountId ?? null,
      category_id: input.categoryId ?? null,
      is_recurring: input.isRecurring ? 1 : 0,
      recurring_rule_id: null,
      description: input.description ?? "",
      version: 0,
      created_by: ctx.userId,
      updated_by: ctx.userId,
      created_at: timestamp,
      updated_at: timestamp,
    },
  };
};

export const mintPowerSyncEdit = (
  ctx: PowerSyncMintContext,
  row: LedgerTransaction,
  changes: TransactionEdit,
): MintedPowerSyncUpdate => {
  const command = mintEdit(ctx, row, changes);
  return {
    command,
    changes: {
      ...(changes.type !== undefined && { type: changes.type }),
      ...(changes.amount !== undefined && { amount_minor: changes.amount }),
      ...(changes.date !== undefined && { date: changes.date }),
      ...(changes.accountId !== undefined && {
        account_id: changes.accountId,
        currency: ctx.accountCurrency(changes.accountId),
      }),
      ...(changes.toAccountId !== undefined && { to_account_id: changes.toAccountId }),
      ...(changes.categoryId !== undefined && { category_id: changes.categoryId }),
      ...(changes.description !== undefined && { description: changes.description }),
      version: row.version + 1,
      updated_by: ctx.userId,
      updated_at: command.issuedAt ?? ctx.now(),
    },
  };
};

export const mintPowerSyncRemove = (
  ctx: PowerSyncMintContext,
  row: LedgerTransaction,
): MintedPowerSyncDelete => ({
  command: mintRemove(ctx, row),
  id: row.id,
});

export const mintPowerSyncRefund = (
  ctx: PowerSyncMintContext,
  input: RefundInput,
  original: PowerSyncTransactionRow,
): MintedPowerSyncCreate => {
  const minted = mintRefund(ctx, input);
  const timestamp = minted.command.issuedAt ?? ctx.now();
  return {
    ...minted,
    row: {
      id: minted.receipt.id,
      ledger_id: ctx.binding.ledgerId,
      household_id: ctx.binding.householdId,
      type: "income",
      amount_minor: input.amount,
      currency: input.currency,
      original_amount_minor: null,
      original_currency: null,
      exchange_rate: null,
      date: input.date,
      account_id: input.depositAccountId,
      to_account_id: null,
      category_id: original.category_id,
      is_recurring: 0,
      recurring_rule_id: null,
      description: `Refund of ${input.originalTransactionId}`,
      version: 0,
      created_by: ctx.userId,
      updated_by: ctx.userId,
      created_at: timestamp,
      updated_at: timestamp,
    },
  };
};
