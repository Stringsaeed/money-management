import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { assignment, budgetWorkspace, envelope } from "@trove/db/schema/budget";
import { ledgerAccount, transaction } from "@trove/db/schema/ledger";
import type {
  AppliedResult,
  CommandEnvelope,
  CommandResult,
  ImportBundlePayload,
} from "@trove/protocol";

import { applyCommand } from "./pipeline";
import { createTestDb } from "./test-db";
import { computeImportManifest } from "../migration/manifest";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const ADMIN = "user-admin";
const MEMBER = "user-member";
const VIEWER = "user-viewer";
const HOUSEHOLD_ID = "household-1";

let db: TestDb;

beforeEach(async () => {
  db = await setupHousehold();
});

async function setupHousehold(): Promise<TestDb> {
  const database = await createTestDb();
  for (const [id, name] of [
    [OWNER, "Owner"],
    [ADMIN, "Admin"],
    [MEMBER, "Member"],
    [VIEWER, "Viewer"],
  ] as const) {
    await database.insert(user).values({ id, name, email: `${id}@example.com` });
  }
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Import Household",
    createdByUserId: OWNER,
  });
  await database.insert(membership).values([
    { id: "membership-owner", userId: OWNER, householdId: HOUSEHOLD_ID, role: "owner", version: 0 },
    { id: "membership-admin", userId: ADMIN, householdId: HOUSEHOLD_ID, role: "admin", version: 0 },
    {
      id: "membership-member",
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      role: "member",
      version: 0,
    },
    {
      id: "membership-viewer",
      userId: VIEWER,
      householdId: HOUSEHOLD_ID,
      role: "viewer",
      version: 0,
    },
  ]);
  return database;
}

function bundleEnvelope(
  payload: ImportBundlePayload,
  commandId = crypto.randomUUID(),
): CommandEnvelope {
  return { commandId, householdId: HOUSEHOLD_ID, kind: "import_bundle", payload };
}

function applyAs(userId: string, env: CommandEnvelope): Promise<CommandResult> {
  return applyCommand({ db, userId, envelope: env });
}

function expectApplied(result: CommandResult): AppliedResult {
  expect(result.kind).toBe("applied");
  return result as AppliedResult;
}

const ACCOUNT_ROW = {
  id: "account-1",
  name: "Checking",
  type: "bank" as const,
  currency: "USD",
  color: "#4A90D9",
  icon: "banknote.fill",
  initialBalanceMinor: 10_000,
  excludeFromTotal: false,
  sortOrder: 0,
  lifecycle: "active" as const,
  lifecycleChangedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("commands.apply — import_bundle authorization", () => {
  it.each([ADMIN, MEMBER, VIEWER])(
    "rejects a %s — only the owner may bulk-import",
    async (userId) => {
      const result = await applyAs(
        userId,
        bundleEnvelope({
          entityType: "account",
          chunkIndex: 0,
          chunkCount: 1,
          rows: [ACCOUNT_ROW],
        }),
      );
      expect(result.kind).toBe("forbidden");
    },
  );

  it("allows the owner", async () => {
    const result = await applyAs(
      OWNER,
      bundleEnvelope({ entityType: "account", chunkIndex: 0, chunkCount: 1, rows: [ACCOUNT_ROW] }),
    );
    expectApplied(result);
  });
});

describe("commands.apply — import_bundle validation", () => {
  it("rejects a malformed row as invalid_intent", async () => {
    const result = await applyAs(
      OWNER,
      bundleEnvelope({
        entityType: "account",
        chunkIndex: 0,
        chunkCount: 1,
        rows: [{ ...ACCOUNT_ROW, type: "not-a-type" }],
      }),
    );
    expect(result.kind).toBe("invalid_intent");
  });

  it("rejects chunkIndex >= chunkCount", async () => {
    const result = await applyAs(
      OWNER,
      bundleEnvelope({ entityType: "account", chunkIndex: 1, chunkCount: 1, rows: [ACCOUNT_ROW] }),
    );
    expect(result.kind).toBe("invalid_intent");
  });
});

describe("commands.apply — import_bundle chunk ordering", () => {
  it("fails a transaction chunk referencing an account that hasn't landed yet", async () => {
    await expect(
      applyAs(
        OWNER,
        bundleEnvelope({
          entityType: "transaction",
          chunkIndex: 0,
          chunkCount: 1,
          rows: [
            {
              id: "txn-1",
              type: "expense",
              amountMinor: 500,
              currency: "USD",
              originalAmountMinor: null,
              originalCurrency: null,
              exchangeRate: null,
              date: "2026-01-05",
              accountId: "account-missing",
              toAccountId: null,
              categoryId: null,
              isRecurring: false,
              recurringRuleId: null,
              description: "Coffee",
              createdAt: "2026-01-05T00:00:00.000Z",
              updatedAt: "2026-01-05T00:00:00.000Z",
            },
          ],
        }),
      ),
    ).rejects.toThrow();
  });

  it("succeeds once accounts import before the transactions that reference them", async () => {
    expectApplied(
      await applyAs(
        OWNER,
        bundleEnvelope({
          entityType: "account",
          chunkIndex: 0,
          chunkCount: 1,
          rows: [ACCOUNT_ROW],
        }),
      ),
    );
    const result = await applyAs(
      OWNER,
      bundleEnvelope({
        entityType: "transaction",
        chunkIndex: 0,
        chunkCount: 1,
        rows: [
          {
            id: "txn-1",
            type: "expense",
            amountMinor: 500,
            currency: "USD",
            originalAmountMinor: null,
            originalCurrency: null,
            exchangeRate: null,
            date: "2026-01-05",
            accountId: ACCOUNT_ROW.id,
            toAccountId: null,
            categoryId: null,
            isRecurring: false,
            recurringRuleId: null,
            description: "Coffee",
            createdAt: "2026-01-05T00:00:00.000Z",
            updatedAt: "2026-01-05T00:00:00.000Z",
          },
        ],
      }),
    );
    expectApplied(result);
    const rows = await db
      .select()
      .from(transaction)
      .where(and(eq(transaction.householdId, HOUSEHOLD_ID), eq(transaction.id, "txn-1")));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.amountMinor).toBe(500);
    expect(rows[0]?.createdBy).toBe(OWNER);
  });
});

describe("commands.apply — import_bundle idempotency", () => {
  it("resending the same rows under a fresh commandId never duplicates them", async () => {
    const envelopeChunk: ImportBundlePayload = {
      entityType: "account",
      chunkIndex: 0,
      chunkCount: 1,
      rows: [ACCOUNT_ROW],
    };
    expectApplied(await applyAs(OWNER, bundleEnvelope(envelopeChunk)));
    // A different commandId — as if the client's ack was lost and it retried
    // with a brand-new envelope rather than replaying the stored result.
    expectApplied(await applyAs(OWNER, bundleEnvelope(envelopeChunk)));

    const rows = await db
      .select()
      .from(ledgerAccount)
      .where(
        and(eq(ledgerAccount.householdId, HOUSEHOLD_ID), eq(ledgerAccount.id, ACCOUNT_ROW.id)),
      );
    expect(rows).toHaveLength(1);
  });
});

describe("commands.apply — import_bundle end-to-end + manifest recompute", () => {
  it("imports the full dependency-ordered chain and the manifest reconciles", async () => {
    expectApplied(
      await applyAs(
        OWNER,
        bundleEnvelope({
          entityType: "account",
          chunkIndex: 0,
          chunkCount: 1,
          rows: [ACCOUNT_ROW],
        }),
      ),
    );
    expectApplied(
      await applyAs(
        OWNER,
        bundleEnvelope({
          entityType: "transaction",
          chunkIndex: 0,
          chunkCount: 1,
          rows: [
            {
              id: "txn-1",
              type: "expense",
              amountMinor: 1_200,
              currency: "USD",
              originalAmountMinor: null,
              originalCurrency: null,
              exchangeRate: null,
              date: "2026-01-05",
              accountId: ACCOUNT_ROW.id,
              toAccountId: null,
              categoryId: null,
              isRecurring: false,
              recurringRuleId: null,
              description: "Groceries",
              createdAt: "2026-01-05T00:00:00.000Z",
              updatedAt: "2026-01-05T00:00:00.000Z",
            },
            {
              id: "txn-2",
              type: "expense",
              amountMinor: 300,
              currency: "USD",
              originalAmountMinor: null,
              originalCurrency: null,
              exchangeRate: null,
              date: "2026-01-06",
              accountId: ACCOUNT_ROW.id,
              toAccountId: null,
              categoryId: null,
              isRecurring: false,
              recurringRuleId: null,
              description: "Coffee",
              createdAt: "2026-01-06T00:00:00.000Z",
              updatedAt: "2026-01-06T00:00:00.000Z",
            },
          ],
        }),
      ),
    );
    expectApplied(
      await applyAs(
        OWNER,
        bundleEnvelope({
          entityType: "budgetWorkspace",
          chunkIndex: 0,
          chunkCount: 1,
          rows: [
            {
              currency: "USD",
              activationPeriod: "2026-01",
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        }),
      ),
    );
    expectApplied(
      await applyAs(
        OWNER,
        bundleEnvelope({
          entityType: "envelope",
          chunkIndex: 0,
          chunkCount: 1,
          rows: [
            {
              id: "envelope-1",
              currency: "USD",
              name: "Groceries",
              icon: "🛒",
              color: "#8B9D83",
              lifecycle: "active",
              sortOrder: 0,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        }),
      ),
    );
    expectApplied(
      await applyAs(
        OWNER,
        bundleEnvelope({
          entityType: "assignment",
          chunkIndex: 0,
          chunkCount: 1,
          rows: [
            {
              id: "assignment-1",
              currency: "USD",
              budgetPeriod: "2026-01",
              sourceEnvelopeId: null,
              destinationEnvelopeId: "envelope-1",
              amountMinor: 5_000,
              reversesAssignmentId: null,
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        }),
      ),
    );

    const manifest = await computeImportManifest(db, HOUSEHOLD_ID);
    expect(manifest.rowCounts.account).toBe(1);
    expect(manifest.rowCounts.transaction).toBe(2);
    expect(manifest.rowCounts.budgetWorkspace).toBe(1);
    expect(manifest.rowCounts.envelope).toBe(1);
    expect(manifest.rowCounts.assignment).toBe(1);
    expect(manifest.transactionAmountMinorByAccount).toEqual({ [ACCOUNT_ROW.id]: 1_500 });
    expect(manifest.assignmentAmountMinorByCurrency).toEqual({ USD: 5_000 });

    const workspaceRows = await db
      .select()
      .from(budgetWorkspace)
      .where(eq(budgetWorkspace.householdId, HOUSEHOLD_ID));
    expect(workspaceRows).toHaveLength(1);
    const envelopeRows = await db
      .select()
      .from(envelope)
      .where(eq(envelope.householdId, HOUSEHOLD_ID));
    expect(envelopeRows).toHaveLength(1);
    const assignmentRows = await db
      .select()
      .from(assignment)
      .where(eq(assignment.householdId, HOUSEHOLD_ID));
    expect(assignmentRows).toHaveLength(1);
  });
});
