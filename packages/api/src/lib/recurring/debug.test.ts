import { beforeEach, describe, expect, it } from "vitest";
import { user } from "@trove/db/schema/auth";
import { recurringRule } from "@trove/db/schema/recurring";
import { household, membership } from "@trove/db/schema/household";
import { ledgerAccount } from "@trove/db/schema/ledger";
import { settleHouseholdRules } from "./settle-household";
import { createTestDb } from "../commands/test-db";

const OWNER = "user-owner";
const HH = "household-1";
let db: Awaited<ReturnType<typeof createTestDb>>;

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values({ id: OWNER, name: "O", email: "o@e.com" });
  await db.insert(household).values({ id: HH, name: "H", createdByUserId: OWNER });
  await db
    .insert(membership)
    .values({ id: "m", userId: OWNER, householdId: HH, role: "owner", version: 0 });
  await db.insert(ledgerAccount).values({
    householdId: HH,
    id: "account-1",
    name: "a",
    type: "bank",
    currency: "USD",
    initialBalanceMinor: 0,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
});

describe("debug", () => {
  it("settles", async () => {
    await db.insert(recurringRule).values({
      householdId: HH,
      id: "rule-existing",
      name: "Rent existing",
      type: "expense",
      amountMinor: 120000,
      currency: "USD",
      accountId: "account-1",
      description: "Monthly rent",
      frequency: "month",
      intervalCount: 1,
      startDate: "2026-01-31",
      timeZone: "Asia/Dubai",
      eligibilityFloor: "2026-01-31",
      revision: 1,
      createdBy: OWNER,
      updatedBy: OWNER,
    });
    const rows = await db.select().from(recurringRule);
    console.log("rules:", rows.length, rows[0]?.lifecycle, rows[0]?.health, rows[0]?.amountMinor);
    const summary = await settleHouseholdRules(
      db,
      { householdId: HH, userId: OWNER },
      {
        next: (() => {
          let n = 0;
          return () => `tx-${++n}`;
        })(),
      },
      "2026-04-15",
      "2026-04-15T08:00:00.000Z",
    );
    console.log("summary:", JSON.stringify(summary.rules));
    expect(true).toBe(true);
  }, 20000);
});
