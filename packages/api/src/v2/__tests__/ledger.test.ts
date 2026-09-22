import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { user } from "@trove/db/schema/auth";
import { v2GuestSession } from "@trove/db/schema/v2-identity";

import { createAccount, deleteAccount, listAccounts } from "../accounts";
import { createCategory, deleteCategory, listCategories } from "../categories";
import { getHome } from "../home";
import {
  createRecurringRule,
  listRecurringRules,
  settleRecurringRule,
  updateRecurringRule,
} from "../recurring";
import { resolveV2LedgerContext } from "../shared";
import type { V2Principal } from "../contracts";
import { createTransaction, listTransactions } from "../transactions";
import { claimGuestLedgerInTransaction } from "../guest-claim";
import { createTestDb } from "../../test-support/db";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const guest = { kind: "guest", guestSessionId: "guest_test" } as const;
const userPrincipal = {
  kind: "user",
  userId: "user-v2",
  workosUserId: "user-v2",
  email: "user@example.com",
  name: "V2 User",
} as const;

describe("V2 ledger", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb({ householdLedgerMirror: false });
    await db
      .insert(user)
      .values({ id: userPrincipal.userId, name: userPrincipal.name, email: userPrincipal.email });
    await db.insert(v2GuestSession).values({
      id: guest.guestSessionId,
      tokenHash: "guest-token-hash",
      clientKeyHash: "guest-client-hash",
      status: "active",
      expiresAt: new Date(Date.now() + 60_000),
    });
  });

  async function personal(principal: V2Principal = userPrincipal) {
    return resolveV2LedgerContext(db, principal, { kind: "personal" });
  }

  it("keeps CRUD, balances, and Home aggregates on the V2 ledger", async () => {
    const context = await personal();
    const account = await createAccount(context, {
      id: "checking",
      name: "Everyday",
      type: "checking",
      currency: "USD",
      openingBalanceMinor: 1_000,
    });
    const income = await createTransaction(context, {
      id: "income",
      accountId: account.id,
      kind: "income",
      amountMinor: 500,
      date: "2026-09-01",
      note: "Pay",
    });
    expect(income.currency).toBe("USD");
    await createCategory(context, { id: "food", name: "Food", kind: "expense" });
    await createTransaction(context, {
      id: "expense",
      accountId: account.id,
      categoryId: "food",
      kind: "expense",
      amountMinor: 125,
      date: "2026-09-02",
      note: "Lunch",
    });

    const home = await getHome(context, { date: new Date("2026-09-15T12:00:00.000Z") });
    expect(home.accounts[0]).toMatchObject({ id: "checking", balanceMinor: 1_375 });
    expect(home.totals).toEqual([
      { currency: "USD", incomeMinor: 500, expenseMinor: 125, netMinor: 375 },
    ]);
    expect(home.recentTransactions).toHaveLength(2);
  });

  it("rejects cross-currency transfers and protects stale writes", async () => {
    const context = await personal();
    const usd = await createAccount(context, {
      id: "usd",
      name: "USD",
      type: "checking",
      currency: "USD",
    });
    const eur = await createAccount(context, {
      id: "eur",
      name: "EUR",
      type: "checking",
      currency: "EUR",
    });
    await expect(
      createTransaction(context, {
        accountId: usd.id,
        toAccountId: eur.id,
        kind: "transfer",
        amountMinor: 10,
        date: "2026-09-01",
      }),
    ).rejects.toMatchObject({ code: "currency_mismatch" });

    const created = await createAccount(context, {
      id: "versioned",
      name: "Versioned",
      type: "cash",
      currency: "USD",
    });
    await expect(deleteAccount(context, created.id, 1)).rejects.toMatchObject({
      code: "version_conflict",
    });
  });

  it("cascades Category and Account deletes while preserving unrelated ledger data", async () => {
    const context = await personal();
    const source = await createAccount(context, {
      id: "source",
      name: "Source",
      type: "cash",
      currency: "USD",
      openingBalanceMinor: 1_000,
    });
    const destination = await createAccount(context, {
      id: "destination",
      name: "Destination",
      type: "cash",
      currency: "USD",
      openingBalanceMinor: 500,
    });
    const unrelated = await createAccount(context, {
      id: "unrelated",
      name: "Unrelated",
      type: "cash",
      currency: "USD",
      openingBalanceMinor: 800,
    });
    const category = await createCategory(context, {
      id: "delete-cat",
      name: "Delete",
      kind: "expense",
    });
    const child = await createCategory(context, {
      id: "child-cat",
      name: "Child",
      kind: "expense",
      parentId: category.id,
    });
    const keep = await createCategory(context, {
      id: "keep-cat",
      name: "Keep",
      kind: "expense",
    });
    await createTransaction(context, {
      id: "category-linked",
      accountId: source.id,
      categoryId: category.id,
      kind: "expense",
      amountMinor: 50,
      date: "2026-09-01",
    });
    await createTransaction(context, {
      id: "account-transfer",
      accountId: source.id,
      toAccountId: destination.id,
      kind: "transfer",
      amountMinor: 100,
      date: "2026-09-02",
    });
    await createTransaction(context, {
      id: "unrelated-transaction",
      accountId: unrelated.id,
      categoryId: keep.id,
      kind: "expense",
      amountMinor: 30,
      date: "2026-09-03",
    });
    const categoryRule = await createRecurringRule(context, {
      id: "category-rule",
      name: "Category Rule",
      accountId: source.id,
      categoryId: category.id,
      kind: "expense",
      amountMinor: 25,
      currency: "USD",
      frequency: "day",
      intervalCount: 1,
      startDate: "2026-09-14",
      endDate: null,
      endCount: 1,
      timeZone: "UTC",
    });
    await settleRecurringRule(context, categoryRule.id, new Date("2026-09-15T12:00:00.000Z"));
    await updateRecurringRule(context, categoryRule.id, { categoryId: keep.id }, 2);

    expect(await deleteCategory(context, category.id)).toEqual({
      id: category.id,
      archived: false,
      deleted: true,
    });
    expect(
      (await listCategories(context, { includeArchived: true })).map((item) => item.id),
    ).toEqual([child.id, keep.id]);
    expect(
      (await listCategories(context, { includeArchived: true })).find(
        (item) => item.id === child.id,
      )?.parentId,
    ).toBeNull();
    expect(
      (await listRecurringRules(context, { includeArchived: true })).map((item) => item.id),
    ).toEqual([categoryRule.id]);
    expect((await listTransactions(context)).items.map((item) => item.id)).toEqual([
      "unrelated-transaction",
      "account-transfer",
    ]);
    expect(
      (await settleRecurringRule(context, categoryRule.id, new Date("2026-09-15T12:00:00.000Z")))
        .generatedCount,
    ).toBe(0);
    expect((await listAccounts(context)).find((item) => item.id === source.id)?.balanceMinor).toBe(
      900,
    );

    const accountRule = await createRecurringRule(context, {
      id: "account-rule",
      name: "Account Rule",
      accountId: source.id,
      kind: "expense",
      amountMinor: 40,
      currency: "USD",
      frequency: "day",
      intervalCount: 1,
      startDate: "2026-09-14",
      endDate: null,
      endCount: 1,
      timeZone: "UTC",
    });
    await settleRecurringRule(context, accountRule.id, new Date("2026-09-15T12:00:00.000Z"));
    await updateRecurringRule(context, accountRule.id, { accountId: destination.id }, 2);
    expect(await deleteAccount(context, source.id)).toEqual({
      id: source.id,
      archived: false,
      deleted: true,
    });
    expect((await listAccounts(context)).map((item) => item.id)).toEqual([
      destination.id,
      unrelated.id,
    ]);
    expect(
      (await listAccounts(context)).find((item) => item.id === destination.id)?.balanceMinor,
    ).toBe(500);
    expect(
      (await listAccounts(context)).find((item) => item.id === unrelated.id)?.balanceMinor,
    ).toBe(770);
    expect(
      (await listRecurringRules(context, { includeArchived: true })).map((item) => item.id),
    ).toEqual([accountRule.id]);
    expect((await listTransactions(context)).items.map((item) => item.id)).toEqual([
      "unrelated-transaction",
    ]);
    expect(
      (await settleRecurringRule(context, accountRule.id, new Date("2026-09-15T12:00:00.000Z")))
        .generatedCount,
    ).toBe(0);
  });

  it("keeps cascade deletes isolated to the authenticated ledger", async () => {
    const userContext = await personal();
    const guestContext = await personal(guest);
    const sharedGuestAccount = await createAccount(guestContext, {
      id: "guest-only-account",
      name: "Guest Account",
      type: "cash",
      currency: "USD",
    });
    await createTransaction(guestContext, {
      id: "guest-shared-transaction",
      accountId: sharedGuestAccount.id,
      kind: "income",
      amountMinor: 100,
      date: "2026-09-01",
    });

    await expect(deleteAccount(userContext, sharedGuestAccount.id)).rejects.toMatchObject({
      code: "account_not_found",
    });
    expect((await listAccounts(guestContext)).map((item) => item.id)).toEqual([
      sharedGuestAccount.id,
    ]);
    expect((await listTransactions(guestContext)).items.map((item) => item.id)).toEqual([
      "guest-shared-transaction",
    ]);

    const guestOnlyCategory = await createCategory(guestContext, {
      id: "guest-only-category",
      name: "Guest Only",
      kind: "expense",
    });
    await expect(deleteCategory(userContext, guestOnlyCategory.id)).rejects.toMatchObject({
      code: "category_not_found",
    });
    expect((await listCategories(guestContext)).map((item) => item.id)).toContain(
      guestOnlyCategory.id,
    );
  });

  it("does not partially cascade when a delete has a stale version", async () => {
    const context = await personal();
    const account = await createAccount(context, {
      id: "stale-account",
      name: "Stale Account",
      type: "cash",
      currency: "USD",
    });
    const category = await createCategory(context, {
      id: "stale-category",
      name: "Stale Category",
      kind: "expense",
    });
    await createTransaction(context, {
      id: "stale-transaction",
      accountId: account.id,
      categoryId: category.id,
      kind: "expense",
      amountMinor: 10,
      date: "2026-09-01",
    });

    await expect(deleteCategory(context, category.id, 1)).rejects.toMatchObject({
      code: "version_conflict",
    });
    expect((await listTransactions(context)).items.map((item) => item.id)).toEqual([
      "stale-transaction",
    ]);
    await expect(deleteAccount(context, account.id, 1)).rejects.toMatchObject({
      code: "version_conflict",
    });
    expect((await listAccounts(context)).map((item) => item.id)).toContain(account.id);
    expect((await listCategories(context)).map((item) => item.id)).toContain(category.id);
    expect((await listTransactions(context)).items.map((item) => item.id)).toEqual([
      "stale-transaction",
    ]);
  });

  it("settles recurring rules idempotently into independent transactions", async () => {
    const context = await personal();
    const account = await createAccount(context, {
      id: "recurring",
      name: "Recurring",
      type: "checking",
      currency: "USD",
    });
    const rule = await createRecurringRule(context, {
      id: "coffee-rule",
      name: "Coffee",
      accountId: account.id,
      kind: "expense",
      amountMinor: 25,
      currency: "USD",
      frequency: "day",
      intervalCount: 1,
      startDate: "2026-09-14",
      endDate: null,
      endCount: 1,
      timeZone: "UTC",
    });
    expect(rule.revision).toBe(1);
    const first = await settleRecurringRule(context, rule.id, new Date("2026-09-15T12:00:00.000Z"));
    expect(first.generatedCount).toBe(1);
    const retry = await settleRecurringRule(context, rule.id, new Date("2026-09-15T12:00:00.000Z"));
    expect(retry.generatedCount).toBe(0);
  });

  it("does not let a pre-claim guest write mutate the claimed user ledger", async () => {
    const guestContext = await personal(guest);
    await createAccount(guestContext, {
      id: "guest-account",
      name: "Guest",
      type: "cash",
      currency: "USD",
    });
    const result = await db.transaction((tx) =>
      claimGuestLedgerInTransaction(tx, {
        guestSessionId: guest.guestSessionId,
        user: userPrincipal,
      }),
    );
    expect(result).toBe("claimed");
    await expect(
      createAccount(guestContext, {
        id: "after-claim",
        name: "Should fail",
        type: "cash",
        currency: "USD",
      }),
    ).rejects.toMatchObject({ code: "ledger_reassigned" });
  });

  it("rechecks guest session status before provisioning and writing", async () => {
    const context = await personal(guest);
    await db
      .update(v2GuestSession)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(eq(v2GuestSession.id, guest.guestSessionId));
    await expect(
      createAccount(context, { id: "blocked", name: "Blocked", type: "cash", currency: "USD" }),
    ).rejects.toMatchObject({
      code: "guest_session_invalid",
    });
  });
});
