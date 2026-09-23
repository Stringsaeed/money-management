/* oxlint-disable anti-slop/no-unknown-parameters -- request bodies are parsed by the endpoint-specific response parser immediately after the I/O boundary. */

import { randomUUID } from "expo-crypto";

import type {
  V2Account,
  V2Category,
  V2Home,
  V2LedgerScope,
  V2Page,
  V2RecurringRule,
  V2Transaction,
} from "@trove/api/v2/contracts";

import { apiRequest } from "@/data/http";

import {
  parseAccount,
  parseCategory,
  parseHome,
  parsePage,
  parseRecurringRule,
  parseTransaction,
  accountResponseSchema,
  categorySchema,
  recurringRuleSchema,
  transactionSchema,
  upcomingOccurrenceSchema,
} from "./ledger-schemas";

export type LedgerScope = V2LedgerScope;

export type AccountType = "checking" | "savings" | "cash" | "credit_card" | "investment" | "other";

export interface AccountInput {
  readonly name: string;
  readonly type: AccountType;
  readonly currency: string;
  readonly openingBalanceMinor: number;
}

export type AccountUpdateInput = Partial<AccountInput> & { readonly archived?: boolean };

export interface CategoryInput {
  readonly name: string;
  readonly kind: "income" | "expense";
  readonly color?: string;
  readonly icon?: string;
  readonly parentId?: string | null;
  readonly sortOrder?: number;
}

export type CategoryUpdateInput = Partial<CategoryInput> & { readonly archived?: boolean };

export interface TransactionInput {
  readonly accountId: string;
  readonly categoryId?: string | null;
  readonly toAccountId?: string | null;
  readonly kind: "income" | "expense" | "transfer";
  readonly amountMinor: number;
  readonly date: string;
  readonly note?: string;
}

export interface RecurringRuleInput {
  readonly name: string;
  readonly accountId: string;
  readonly categoryId?: string | null;
  readonly toAccountId?: string | null;
  readonly kind: "income" | "expense" | "transfer";
  readonly amountMinor: number;
  readonly currency: string;
  readonly note?: string;
  readonly frequency: "day" | "week" | "month" | "year";
  readonly intervalCount: number;
  readonly startDate: string;
  readonly endDate?: string | null;
  readonly endCount?: number | null;
  readonly timeZone: string;
}

export interface PageOptions {
  readonly limit?: number;
  readonly cursor?: string | null;
  readonly includeArchived?: boolean;
}

export interface MutationOptions {
  readonly version?: number;
  readonly requestKey?: string;
}

interface RequestOptions extends RequestInit {
  readonly version?: number;
  readonly requestKey?: string;
}

const scopeQuery = (scope: LedgerScope): string => {
  const params = new URLSearchParams({ scope: scope.kind });
  if (scope.kind === "household") params.set("householdId", scope.householdId);
  return params.toString();
};

export const withScope = (path: string, scope: LedgerScope): string =>
  `${path}${path.includes("?") ? "&" : "?"}${scopeQuery(scope)}`;

const request = async <T>(
  path: string,
  options: RequestOptions | undefined,
  parse: (value: unknown) => T,
) => {
  const { requestKey, version, ...fetchOptions } = options ?? {};
  const headers = new Headers(fetchOptions.headers);
  headers.set("Content-Type", "application/json");
  if (version !== undefined) headers.set("If-Match", String(version));
  headers.set("Idempotency-Key", requestKey ?? randomUUID());

  const payload = await apiRequest(path, { ...fetchOptions, headers });
  return parse(payload);
};

const json = (method: string, body: unknown, options: MutationOptions = {}): RequestOptions => ({
  method,
  body: JSON.stringify(body),
  version: options.version,
  requestKey: options.requestKey,
});

const pagePath = (path: string, scope: LedgerScope, options: PageOptions): string => {
  const params = new URLSearchParams(scopeQuery(scope));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.includeArchived) params.set("includeArchived", "true");
  return `${path}?${params.toString()}`;
};

export const ledgerClient = {
  home(scope: LedgerScope): Promise<V2Home> {
    return request(withScope("/home", scope), undefined, parseHome);
  },

  accounts: {
    list(scope: LedgerScope, options: PageOptions = {}): Promise<V2Page<V2Account>> {
      return request(pagePath("/accounts", scope, options), undefined, (payload) =>
        parsePage(accountResponseSchema, payload),
      );
    },
    get(scope: LedgerScope, id: string): Promise<V2Account> {
      return request(
        withScope(`/accounts/${encodeURIComponent(id)}`, scope),
        undefined,
        parseAccount,
      );
    },
    create(
      scope: LedgerScope,
      input: AccountInput,
      options: MutationOptions = {},
    ): Promise<V2Account> {
      return request(withScope("/accounts", scope), json("POST", input, options), parseAccount);
    },
    update(
      scope: LedgerScope,
      id: string,
      input: AccountUpdateInput,
      options: MutationOptions = {},
    ) {
      return request(
        withScope(`/accounts/${encodeURIComponent(id)}`, scope),
        json("PATCH", input, options),
        parseAccount,
      );
    },
    archive(scope: LedgerScope, id: string, version?: number, requestKey?: string) {
      return this.update(scope, id, { archived: true }, { version, requestKey }).then(
        (account) => account,
      );
    },
    restore(scope: LedgerScope, id: string, version?: number, requestKey?: string) {
      return this.update(scope, id, { archived: false }, { version, requestKey }).then(
        (account) => account,
      );
    },
    remove(scope: LedgerScope, id: string, version?: number, requestKey?: string): Promise<void> {
      return request(
        withScope(`/accounts/${encodeURIComponent(id)}`, scope),
        json("DELETE", {}, { version, requestKey }),
        () => undefined,
      );
    },
  },

  categories: {
    list(scope: LedgerScope, options: PageOptions = {}): Promise<V2Page<V2Category>> {
      return request(pagePath("/categories", scope, options), undefined, (payload) =>
        parsePage(categorySchema, payload),
      );
    },
    get(scope: LedgerScope, id: string): Promise<V2Category> {
      return request(
        withScope(`/categories/${encodeURIComponent(id)}`, scope),
        undefined,
        parseCategory,
      );
    },
    create(
      scope: LedgerScope,
      input: CategoryInput,
      options: MutationOptions = {},
    ): Promise<V2Category> {
      return request(withScope("/categories", scope), json("POST", input, options), parseCategory);
    },
    update(
      scope: LedgerScope,
      id: string,
      input: CategoryUpdateInput,
      options: MutationOptions = {},
    ) {
      return request(
        withScope(`/categories/${encodeURIComponent(id)}`, scope),
        json("PATCH", input, options),
        parseCategory,
      );
    },
    archive(scope: LedgerScope, id: string, version?: number, requestKey?: string) {
      return this.update(scope, id, { archived: true }, { version, requestKey });
    },
    restore(scope: LedgerScope, id: string, version?: number, requestKey?: string) {
      return this.update(scope, id, { archived: false }, { version, requestKey });
    },
    remove(scope: LedgerScope, id: string, version?: number, requestKey?: string): Promise<void> {
      return request(
        withScope(`/categories/${encodeURIComponent(id)}`, scope),
        json("DELETE", {}, { version, requestKey }),
        () => undefined,
      );
    },
  },

  transactions: {
    list(scope: LedgerScope, options: PageOptions = {}): Promise<V2Page<V2Transaction>> {
      return request(pagePath("/transactions", scope, options), undefined, (payload) =>
        parsePage(transactionSchema, payload),
      );
    },
    get(scope: LedgerScope, id: string): Promise<V2Transaction> {
      return request(
        withScope(`/transactions/${encodeURIComponent(id)}`, scope),
        undefined,
        parseTransaction,
      );
    },
    create(
      scope: LedgerScope,
      input: TransactionInput,
      options: MutationOptions = {},
    ): Promise<V2Transaction> {
      return request(
        withScope("/transactions", scope),
        json("POST", input, options),
        parseTransaction,
      );
    },
    update(
      scope: LedgerScope,
      id: string,
      input: Partial<TransactionInput>,
      options: MutationOptions = {},
    ) {
      return request(
        withScope(`/transactions/${encodeURIComponent(id)}`, scope),
        json("PATCH", input, options),
        parseTransaction,
      );
    },
    remove(scope: LedgerScope, id: string, version?: number, requestKey?: string): Promise<void> {
      return request(
        withScope(`/transactions/${encodeURIComponent(id)}`, scope),
        json("DELETE", {}, { version, requestKey }),
        () => undefined,
      );
    },
  },

  recurring: {
    upcoming(scope: LedgerScope) {
      return request(withScope("/recurring/upcoming", scope), undefined, (payload) =>
        parsePage(upcomingOccurrenceSchema, payload),
      );
    },
    list(scope: LedgerScope, options: PageOptions = {}): Promise<V2Page<V2RecurringRule>> {
      return request(pagePath("/recurring", scope, options), undefined, (payload) =>
        parsePage(recurringRuleSchema, payload),
      );
    },
    get(scope: LedgerScope, id: string): Promise<V2RecurringRule> {
      return request(
        withScope(`/recurring/${encodeURIComponent(id)}`, scope),
        undefined,
        parseRecurringRule,
      );
    },
    create(
      scope: LedgerScope,
      input: RecurringRuleInput,
      options: MutationOptions = {},
    ): Promise<V2RecurringRule> {
      return request(
        withScope("/recurring", scope),
        json("POST", input, options),
        parseRecurringRule,
      );
    },
    update(
      scope: LedgerScope,
      id: string,
      input: Partial<RecurringRuleInput> & { lifecycle?: V2RecurringRule["lifecycle"] },
      options: MutationOptions = {},
    ) {
      return request(
        withScope(`/recurring/${encodeURIComponent(id)}`, scope),
        json("PATCH", input, options),
        parseRecurringRule,
      );
    },
  },
};
