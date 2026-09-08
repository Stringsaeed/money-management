// oxlint-disable anti-slop/no-chained-type-assertions, anti-slop/require-safety-comment-for-type-assertion -- PGlite and postgres-js Drizzle clients share the exercised query surface
import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import type { createDb } from "@trove/db";
import { verification } from "@trove/db/schema/auth";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { invalidatePriorMagicLinks, invalidatePriorResetLinks } from "./invalidate-links";

type TroveDb = ReturnType<typeof createDb>;

const expiresAt = new Date("2030-01-01T00:00:00.000Z");

describe("Postgres verification invalidation", () => {
  let client: PGlite;
  let db: TroveDb;

  beforeEach(async () => {
    client = new PGlite();
    await client.exec(`
      CREATE TABLE verification (
        id text PRIMARY KEY,
        identifier text NOT NULL,
        value text NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX verification_identifier_idx ON verification (identifier);
    `);
    db = drizzle({ client }) as unknown as TroveDb;
  });

  afterEach(async () => {
    await client.close();
  });

  it("keeps only the current token across repeated mixed-case magic-link requests", async () => {
    await db.insert(verification).values({
      id: "magic-first",
      identifier: "first-token",
      value: JSON.stringify({ email: "Ada@Trove.ing" }),
      expiresAt,
    });

    await invalidatePriorMagicLinks(db, "ada@trove.ing", "first-token");
    expect((await db.select().from(verification)).map(({ id }) => id)).toEqual(["magic-first"]);

    await db.insert(verification).values({
      id: "magic-second",
      identifier: "second-token",
      value: JSON.stringify({ email: "ADA@TROVE.ING" }),
      expiresAt,
    });

    await invalidatePriorMagicLinks(db, "aDa@tRoVe.InG", "second-token");
    expect((await db.select().from(verification)).map(({ id }) => id)).toEqual(["magic-second"]);
  });

  it("invalidates prior mixed-case magic links while preserving current and unrelated rows", async () => {
    await db.insert(verification).values([
      {
        id: "magic-old-lower",
        identifier: "old-token-lower",
        value: JSON.stringify({ email: "ada@trove.ing" }),
        expiresAt,
      },
      {
        id: "magic-old-mixed",
        identifier: "old-token-mixed",
        value: JSON.stringify({ email: "Ada@Trove.ing", name: "Ada" }),
        expiresAt,
      },
      {
        id: "magic-current",
        identifier: "current-token",
        value: JSON.stringify({ email: "ADA@TROVE.ING" }),
        expiresAt,
      },
      {
        id: "reset",
        identifier: "reset-password:reset-token",
        value: "user-1",
        expiresAt,
      },
      {
        id: "unrelated-json",
        identifier: "email-verification:token",
        value: JSON.stringify({ email: "ada@trove.ing", purpose: "verify-email" }),
        expiresAt,
      },
      {
        id: "unrelated-invalid",
        identifier: "unrelated-token",
        value: "not-json",
        expiresAt,
      },
    ]);

    await invalidatePriorMagicLinks(db, "aDa@tRoVe.InG", "current-token");

    const remaining = await db.select().from(verification);
    expect(remaining.map(({ id }) => id).sort()).toEqual([
      "magic-current",
      "reset",
      "unrelated-invalid",
      "unrelated-json",
    ]);
  });

  it("invalidates only prior password reset links for the same user", async () => {
    await db.insert(verification).values([
      {
        id: "reset-old",
        identifier: "reset-password:old-token",
        value: "user-1",
        expiresAt,
      },
      {
        id: "reset-current",
        identifier: "reset-password:current-token",
        value: "user-1",
        expiresAt,
      },
      {
        id: "reset-other-user",
        identifier: "reset-password:other-token",
        value: "user-2",
        expiresAt,
      },
      {
        id: "magic-same-value",
        identifier: "magic-token",
        value: "user-1",
        expiresAt,
      },
    ]);

    await invalidatePriorResetLinks(db, "user-1", "reset-password:current-token");

    const remaining = await db.select().from(verification);
    expect(remaining.map(({ id }) => id).sort()).toEqual([
      "magic-same-value",
      "reset-current",
      "reset-other-user",
    ]);
  });

  it("keeps SQLite functions out of the Postgres auth path", () => {
    const source = readFileSync(new URL("./invalidate-links.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/\bjson_extract\s*\(/i);
    expect(source).not.toMatch(/\bjson_each\s*\(/i);
    expect(source).not.toMatch(/\bjson_tree\s*\(/i);
  });
});
