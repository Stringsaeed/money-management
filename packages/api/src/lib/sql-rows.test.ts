import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { queryRows } from "./sql-rows";

describe("queryRows", () => {
  it("returns an execute() array", async () => {
    const rows = await queryRows<{ id: string }>(
      { execute: async () => [{ id: "a" }] },
      sql`select 1`,
    );
    expect(rows).toEqual([{ id: "a" }]);
  });

  it("returns a { rows } result", async () => {
    const rows = await queryRows<{ id: string }>(
      { execute: async () => ({ rows: [{ id: "b" }] }) },
      sql`select 1`,
    );
    expect(rows).toEqual([{ id: "b" }]);
  });

  it("rejects an unknown execute() shape", async () => {
    await expect(queryRows({ execute: async () => ({ count: 1 }) }, sql`select 1`)).rejects.toThrow(
      "unexpected execute() result shape",
    );
  });
});
