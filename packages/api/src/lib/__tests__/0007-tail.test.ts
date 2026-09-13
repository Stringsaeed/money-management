import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../db/src/migrations/0007_postgres_baseline.sql",
  ),
  "utf8",
);

describe("0007 postgres baseline tail", () => {
  it("swallows CREATE ROLE privilege failure so PUBLICATION still runs", () => {
    expect(sql).toContain("WHEN insufficient_privilege THEN NULL");
    expect(sql.indexOf("CREATE PUBLICATION")).toBeGreaterThan(
      sql.indexOf("insufficient_privilege"),
    );
    expect(sql).toContain("IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'powersync_role')");
  });
});
