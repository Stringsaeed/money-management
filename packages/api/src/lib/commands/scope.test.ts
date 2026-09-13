import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";

import { createTestDb } from "../../test-support/db";
import { hasPgCode } from "../pg-error";
import { queryRows } from "../sql-rows";
import { ensureUserProjection } from "./scope";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb({ householdLedgerMirror: false });
});

describe("ensureUserProjection", () => {
  it("projects a WorkOS user with no email claim onto a placeholder address", async () => {
    const id = "user_01M28TK8JZ27ZQZ40DCMMFHJ26";
    await ensureUserProjection(db, { id, email: "", name: "" });

    expect(await db.select().from(user).where(eq(user.id, id))).toEqual([
      expect.objectContaining({
        id,
        name: id,
        email: "user_01M28TK8JZ27ZQZ40DCMMFHJ26@users.workos.invalid",
        emailVerified: true,
        image: null,
        membershipsReconciledAt: null,
      }),
    ]);
  });

  it("keeps a real session email when AuthKit supplies one", async () => {
    const id = "user_with_email";
    await ensureUserProjection(db, {
      id,
      email: " stringsaeed@gmail.com ",
      name: "Saeed",
    });

    expect(await db.select().from(user).where(eq(user.id, id))).toEqual([
      expect.objectContaining({
        id,
        name: "Saeed",
        email: "stringsaeed@gmail.com",
        emailVerified: true,
      }),
    ]);
  });

  it("uses a placeholder email when the claim is whitespace but keeps the name", async () => {
    const id = "user_named";
    await ensureUserProjection(db, { id, email: "   ", name: "Ada" });

    expect(await db.select().from(user).where(eq(user.id, id))).toEqual([
      expect.objectContaining({
        id,
        name: "Ada",
        email: "user_named@users.workos.invalid",
      }),
    ]);
  });

  it("is idempotent when the same WorkOS user is projected twice", async () => {
    const id = "user_idempotent";
    const actor = { id, email: undefined, name: undefined };
    await ensureUserProjection(db, actor);
    await ensureUserProjection(db, actor);

    expect(await db.select().from(user).where(eq(user.id, id))).toHaveLength(1);
  });

  it("reproduces drizzle 42703 when memberships_reconciled_at is missing, then succeeds via narrow insert", async () => {
    await db.execute(sql`ALTER TABLE "user" DROP COLUMN IF EXISTS "memberships_reconciled_at"`);

    const drizzleId = "user_drizzle_42703";
    let drizzleError: Error | undefined;
    try {
      await db
        .insert(user)
        .values({
          id: drizzleId,
          name: drizzleId,
          email: `${drizzleId}@users.workos.invalid`,
          emailVerified: true,
          image: null,
          membershipsReconciledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    } catch (error) {
      if (error instanceof Error) drizzleError = error;
    }
    if (!drizzleError) throw new Error("expected drizzle insert to throw");
    expect(hasPgCode(drizzleError, "42703")).toBe(true);

    const id = "user_01M28TK8JZ27ZQZ40DCMMFHJ26";
    await ensureUserProjection(db, { id, email: "", name: "" });

    const list = await queryRows<{
      id: string;
      name: string;
      email: string;
      email_verified: boolean;
    }>(db, sql`SELECT id, name, email, email_verified FROM "user" WHERE id = ${id}`);
    expect(list).toEqual([
      expect.objectContaining({
        id,
        name: id,
        email: "user_01M28TK8JZ27ZQZ40DCMMFHJ26@users.workos.invalid",
        email_verified: true,
      }),
    ]);
  });
});
