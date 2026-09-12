import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeDirectory } from "../../test-support/fake-directory";
import { createTestDb } from "../../test-support/db";
import { ensureUserProjection } from "../commands/scope";
import { hasPgCode } from "../pg-error";
import { reconcileUserMembershipsIfStale } from "./reconcile";

describe("hasPgCode", () => {
  it("finds SQLSTATE on nested drizzle cause", () => {
    const cause = Object.assign(new Error('column "memberships_reconciled_at" does not exist'), {
      code: "42703",
    });
    const wrapped = new Error("Failed query: select");
    wrapped.cause = cause;
    expect(hasPgCode(wrapped, "42703")).toBe(true);
    expect(hasPgCode(wrapped, "42501")).toBe(false);
  });
});

describe("reconcileUserMembershipsIfStale", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("skips when memberships_reconciled_at is missing (42703)", async () => {
    const db = await createTestDb({ householdLedgerMirror: false });
    await db.execute(sql`ALTER TABLE "user" DROP COLUMN IF EXISTS "memberships_reconciled_at"`);
    await ensureUserProjection(db, { id: "user_1", email: "a@example.com", name: "A" });

    const directory = createFakeDirectory();
    const listSpy = vi.spyOn(directory, "listUserMemberships");

    await expect(
      reconcileUserMembershipsIfStale(
        {
          db,
          directory,
          now: () => new Date("2026-09-12T00:00:00.000Z"),
        },
        "user_1",
        60_000,
      ),
    ).resolves.toBeUndefined();
    expect(listSpy).not.toHaveBeenCalled();
  });
});
