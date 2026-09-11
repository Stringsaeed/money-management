import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { ledgerAccount, transaction } from "@trove/db/schema/ledger";
import type {
  AppliedResult,
  CommandEnvelope,
  CommandResult,
  ImportBundlePayload,
} from "@trove/protocol";
import {
  MAX_IMPORT_APPLY_ROWS,
  MAX_IMPORT_CHUNK_ROWS,
  canonicalizeImportContent,
} from "@trove/protocol";

import { applyCommand } from "./pipeline";
import { createTestDb } from "../../test-support/db";
import { computeImportManifest } from "../migration/manifest";
import { sha256Hex } from "../migration/import-content";

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
    { id: "membership-owner", userId: OWNER, householdId: HOUSEHOLD_ID, role: "admin" },
    { id: "membership-admin", userId: ADMIN, householdId: HOUSEHOLD_ID, role: "admin" },
    {
      id: "membership-member",
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      role: "member",
    },
    {
      id: "membership-viewer",
      userId: VIEWER,
      householdId: HOUSEHOLD_ID,
      role: "viewer",
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
  it.each([MEMBER, VIEWER])(
    "rejects a %s — only a Household admin may bulk-import",
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

  it.each([OWNER, ADMIN])("allows every admin (%s)", async (userId) => {
    const result = await applyAs(
      userId,
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
    expectApplied(await applyAs(OWNER, bundleEnvelope(envelopeChunk)));

    const rows = await db
      .select()
      .from(ledgerAccount)
      .where(
        and(eq(ledgerAccount.householdId, HOUSEHOLD_ID), eq(ledgerAccount.id, ACCOUNT_ROW.id)),
      );
    expect(rows).toHaveLength(1);
  });

  it("rejects a fresh command when an existing id has different content", async () => {
    const original: ImportBundlePayload = {
      entityType: "account",
      chunkIndex: 0,
      chunkCount: 1,
      rows: [ACCOUNT_ROW],
    };
    expectApplied(await applyAs(OWNER, bundleEnvelope(original)));

    const result = await applyAs(
      OWNER,
      bundleEnvelope({ ...original, rows: [{ ...ACCOUNT_ROW, name: "Collision" }] }),
    );

    expect(result).toEqual({
      kind: "conflict",
      reason: "import_row_conflict",
      current: { entityType: "account", rowId: ACCOUNT_ROW.id },
    });
    const stored = await db
      .select()
      .from(ledgerAccount)
      .where(eq(ledgerAccount.id, ACCOUNT_ROW.id));
    expect(stored).toHaveLength(1);
    expect(stored[0]?.name).toBe(ACCOUNT_ROW.name);
  });

  it("returns a typed conflict for the same content under another household", async () => {
    await db.insert(household).values({
      id: "household-other",
      name: "Other",
      createdByUserId: OWNER,
    });
    await db.insert(ledgerAccount).values({
      ledgerId: "household-other",
      householdId: "household-other",
      ...ACCOUNT_ROW,
      initialBalanceMinor: ACCOUNT_ROW.initialBalanceMinor,
      ownerUserId: null,
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
      createdAt: new Date(ACCOUNT_ROW.createdAt),
      updatedAt: new Date(ACCOUNT_ROW.updatedAt),
    });

    const result = await applyAs(
      OWNER,
      bundleEnvelope({
        entityType: "account",
        chunkIndex: 0,
        chunkCount: 1,
        rows: [ACCOUNT_ROW],
      }),
    );

    expect(result).toEqual({
      kind: "conflict",
      reason: "import_row_conflict",
      current: { entityType: "account", rowId: ACCOUNT_ROW.id },
    });
  });

  it("accepts an exact transaction retry under a fresh commandId", async () => {
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
    const transactionChunk: ImportBundlePayload = {
      entityType: "transaction",
      chunkIndex: 0,
      chunkCount: 1,
      rows: [
        {
          id: "txn-retry",
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
    };

    expectApplied(await applyAs(OWNER, bundleEnvelope(transactionChunk)));
    expectApplied(await applyAs(OWNER, bundleEnvelope(transactionChunk)));
    expect(await db.select().from(transaction).where(eq(transaction.id, "txn-retry"))).toHaveLength(
      1,
    );
  });
});

describe("import_bundle bind budget", () => {
  it("applies a chunk with more than 100 bound values in one transaction", async () => {
    const rows = Array.from({ length: 6 }, (_, index) => ({
      ...ACCOUNT_ROW,
      id: `acct-bind-${index}`,
      name: `Bind ${index}`,
    }));
    expect(rows.length).toBeGreaterThan(MAX_IMPORT_CHUNK_ROWS);
    expect(rows.length).toBeLessThanOrEqual(MAX_IMPORT_APPLY_ROWS);
    expect(rows.length * 19).toBeGreaterThan(100);
    expectApplied(
      await applyAs(
        OWNER,
        bundleEnvelope({
          entityType: "account",
          chunkIndex: 0,
          chunkCount: 1,
          rows,
        }),
      ),
    );
    const stored = await db
      .select({ id: ledgerAccount.id })
      .from(ledgerAccount)
      .where(eq(ledgerAccount.householdId, HOUSEHOLD_ID));
    expect(stored.map((row) => row.id).sort()).toEqual(rows.map((row) => row.id).sort());
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
    const manifest = await computeImportManifest(db, HOUSEHOLD_ID);
    expect(manifest.rowCounts).toEqual({
      account: 1,
      assignment: 0,
      budget_workspace: 0,
      category: 0,
      category_mapping: 0,
      envelope: 0,
      funding_membership: 0,
      recurring_occurrence: 0,
      recurring_rule: 0,
      rollover_setting: 0,
      transaction: 2,
    });
    expect(manifest.transactionAmountMinorByAccount).toEqual({ [ACCOUNT_ROW.id]: 1_500 });
  });

  it("imports recurring and budget facts in dependency order", async () => {
    const timestamp = "2026-01-01T00:00:00.000Z";
    const rows: {
      entityType: ImportBundlePayload["entityType"];
      row: Readonly<Record<string, unknown>>;
    }[] = [
      { entityType: "account", row: ACCOUNT_ROW },
      {
        entityType: "category",
        row: {
          id: "category-1",
          name: "Housing",
          type: "expense",
          color: "#8B9D83",
          icon: "house",
          parentId: null,
          sortOrder: 0,
          lifecycle: "active",
          lifecycleChangedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      {
        entityType: "recurring_rule",
        row: {
          id: "rule-1",
          name: "Rent",
          type: "expense",
          amountMinor: 100,
          currency: "USD",
          accountId: "account-1",
          toAccountId: null,
          categoryId: "category-1",
          description: "",
          frequency: "month",
          intervalCount: 1,
          startDate: "2026-01-01",
          endDate: null,
          endCount: null,
          timeZone: "Asia/Dubai",
          lifecycle: "active",
          health: "ready",
          attentionReasons: "[]",
          attentionDetails: null,
          eligibilityFloor: "2026-01-01",
          revision: 1,
          lifecycleChangedAt: null,
          healthChangedAt: null,
          lastSettlementAttemptAt: null,
          lastSettlementError: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      {
        entityType: "budget_workspace",
        row: {
          id: "workspace-1",
          currency: "USD",
          activationPeriod: "2026-01",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      {
        entityType: "envelope",
        row: {
          id: "envelope-1",
          currency: "USD",
          name: "Needs",
          icon: "box",
          color: "#8B9D83",
          lifecycle: "active",
          sortOrder: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      {
        entityType: "category_mapping",
        row: {
          id: "mapping-1",
          categoryId: "category-1",
          envelopeId: "envelope-1",
          effectiveFromPeriod: "2026-01",
          createdAt: timestamp,
        },
      },
      {
        entityType: "funding_membership",
        row: {
          id: "funding-1",
          accountId: "account-1",
          currency: "USD",
          active: true,
          effectiveFromPeriod: "2026-01",
          createdAt: timestamp,
        },
      },
      {
        entityType: "rollover_setting",
        row: {
          id: "rollover-1",
          envelopeId: "envelope-1",
          effectiveFromPeriod: "2026-01",
          positiveRollover: true,
          createdAt: timestamp,
        },
      },
      {
        entityType: "assignment",
        row: {
          id: "assignment-1",
          currency: "USD",
          budgetPeriod: "2026-01",
          sourceEnvelopeId: null,
          destinationEnvelopeId: "envelope-1",
          amountMinor: 50,
          reversesAssignmentId: null,
          createdAt: timestamp,
        },
      },
      {
        entityType: "transaction",
        row: {
          id: "transaction-1",
          type: "expense",
          amountMinor: 25,
          currency: "USD",
          originalAmountMinor: null,
          originalCurrency: null,
          exchangeRate: null,
          date: "2026-01-01",
          accountId: "account-1",
          toAccountId: null,
          categoryId: "category-1",
          isRecurring: true,
          recurringRuleId: "rule-1",
          description: "Rent",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      {
        entityType: "recurring_occurrence",
        row: {
          id: "occurrence-1",
          ruleId: "rule-1",
          scheduledDate: "2026-01-01",
          transactionId: "transaction-1",
          settledAt: timestamp,
        },
      },
    ];

    for (const { entityType, row } of rows) {
      expectApplied(
        await applyAs(
          OWNER,
          bundleEnvelope({ entityType, chunkIndex: 0, chunkCount: 1, rows: [row] }),
        ),
      );
    }

    const manifest = await computeImportManifest(db, HOUSEHOLD_ID);
    expect(manifest.rowCounts).toEqual({
      account: 1,
      assignment: 1,
      budget_workspace: 1,
      category: 1,
      category_mapping: 1,
      envelope: 1,
      funding_membership: 1,
      recurring_occurrence: 1,
      recurring_rule: 1,
      rollover_setting: 1,
      transaction: 1,
    });
    expect(manifest.contentDigest).toBe(
      await sha256Hex(
        canonicalizeImportContent(
          rows.map(({ entityType, row }) => ({
            entityType,
            row: row as Readonly<Record<string, string | number | boolean | null>>,
          })),
        ),
      ),
    );
  });
});
