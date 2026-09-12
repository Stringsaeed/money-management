import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestDb } from "../../test-support/db";
import { createFakeDirectory } from "../../test-support/fake-directory";
import { ensureUserProjection } from "../commands/scope";
import { hasPgCode } from "../pg-error";
import { listMyHouseholds, type HouseholdDeps } from "./service";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

let db: TestDb;
let deps: HouseholdDeps;

beforeEach(async () => {
  db = await createTestDb({ householdLedgerMirror: false });
  // Prod after #248: stamp column absent; created_at/updated_at may lack defaults.
  await db.execute(sql`ALTER TABLE "user" DROP COLUMN IF EXISTS "memberships_reconciled_at"`);
  await db.execute(sql`ALTER TABLE "user" ALTER COLUMN "created_at" DROP DEFAULT`);
  await db.execute(sql`ALTER TABLE "user" ALTER COLUMN "updated_at" DROP DEFAULT`);
  deps = {
    db,
    directory: createFakeDirectory(),
    now: () => new Date("2026-09-12T00:00:00.000Z"),
  };
});

describe("hasPgCode hardening", () => {
  it("finds non-enumerable postgres.js code on nested cause", () => {
    const cause = new Error('column "memberships_reconciled_at" does not exist');
    Object.defineProperty(cause, "code", {
      value: "42703",
      enumerable: false,
      configurable: true,
    });
    const wrapped = new Error("Failed query: select");
    wrapped.cause = cause;
    expect(hasPgCode(wrapped, "42703")).toBe(true);
  });

  it("matches 42703 / undefined_column when only the message carries it", () => {
    const cause = new Error("undefined_column: column memberships_reconciled_at does not exist");
    const wrapped = new Error("Failed query: select");
    wrapped.cause = cause;
    expect(hasPgCode(wrapped, "42703")).toBe(true);
    expect(hasPgCode(wrapped, "23502")).toBe(false);
  });
});

describe("listMyHouseholds without stamp column or timestamp defaults", () => {
  it("fails the pre-fix four-column insert with 23502 when defaults are gone", async () => {
    let caught: Error | undefined;
    try {
      await db.execute(sql`
        INSERT INTO "user" ("id", "name", "email", "email_verified")
        VALUES (${"user_legacy"}, ${"Legacy"}, ${"legacy@example.com"}, ${true})
        ON CONFLICT DO NOTHING
      `);
    } catch (error) {
      if (error instanceof Error) caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(hasPgCode(caught!, "23502")).toBe(true);
  });

  it("returns [] for first-login listMine after widened ensure-user insert", async () => {
    const listSpy = vi.spyOn(deps.directory, "listUserMemberships");
    await expect(
      listMyHouseholds(deps, {
        id: "user_01M28TK8JZ27ZQZ40DCMMFHJ26",
        email: "",
        name: "",
      }),
    ).resolves.toEqual([]);
    expect(listSpy).not.toHaveBeenCalled();
  });

  it("ensureUserProjection succeeds twice when stamp column and defaults are absent", async () => {
    const actor = { id: "user_idempotent_drift", email: "", name: "" };
    await ensureUserProjection(db, actor);
    await ensureUserProjection(db, actor);
  });
});
