import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { user } from "@trove/db/schema/auth";
import { v2GuestSession } from "@trove/db/schema/v2-identity";

import { createAccount, deleteAccount, listAccounts } from "../accounts";
import { createCategory, deleteCategory } from "../categories";
import { getHome } from "../home";
import { createRecurringRule, settleRecurringRule } from "../recurring";
import { resolveV2LedgerContext } from "../shared";
import type { V2Principal } from "../contracts";
import { createTransaction } from "../transactions";
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

  it("archives Accounts and Categories that carry history", async () => {
    const context = await personal();
    const account = await createAccount(context, {
      id: "history",
      name: "History",
      type: "cash",
      currency: "USD",
    });
    const category = await createCategory(context, {
      id: "history-cat",
      name: "History",
      kind: "expense",
    });
    await createTransaction(context, {
      accountId: account.id,
      categoryId: category.id,
      kind: "expense",
      amountMinor: 50,
      date: "2026-09-01",
    });
    expect(await deleteAccount(context, account.id)).toEqual({
      id: account.id,
      archived: true,
      deleted: false,
    });
    expect(await deleteCategory(context, category.id)).toEqual({
      id: category.id,
      archived: true,
      deleted: false,
    });
    expect(
      (await listAccounts(context, { includeArchived: true })).find(
        (item) => item.id === account.id,
      )?.archived,
    ).toBe(true);
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
