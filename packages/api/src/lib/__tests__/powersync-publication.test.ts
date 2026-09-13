import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";

import {
  assignment,
  budgetWorkspace,
  categoryMapping,
  envelope,
  fundingMembership,
  refundLink,
  rolloverSetting,
} from "@trove/db/schema/budget";
import { recurringOccurrence, recurringRule } from "@trove/db/schema/recurring";

const migration = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../db/src/migrations/0009_expand_powersync_publication.sql",
  ),
  "utf8",
);

const publishedTables = [
  "membership",
  "accounts",
  "categories",
  "transactions",
  "budget_workspaces",
  "envelopes",
  "category_mappings",
  "funding_memberships",
  "rollover_settings",
  "assignments",
  "refund_links",
  "recurring_rules",
  "recurring_occurrences",
] as const;

const domainTables = [
  budgetWorkspace,
  envelope,
  categoryMapping,
  fundingMembership,
  rolloverSetting,
  assignment,
  refundLink,
  recurringRule,
  recurringOccurrence,
] as const;

describe("expanded PowerSync publication", () => {
  it.each(publishedTables)("publishes public.%s", (table) => {
    expect(migration).toContain(`public.${table}`);
  });

  it("grants the replication role access to every expanded domain table", () => {
    const grant = migration.match(/GRANT SELECT ON TABLE([\s\S]*?)TO powersync_role;/)?.[1];
    expect(grant).toBeDefined();
    for (const table of publishedTables.slice(4)) {
      expect(grant).toContain(`public.${table}`);
    }
  });

  it.each(domainTables)("gives $name one text primary key named id", (table) => {
    const config = getTableConfig(table);
    const primaryColumns = config.columns.filter((column) => column.primary);
    expect(primaryColumns.map((column) => column.name)).toEqual(["id"]);
    expect(primaryColumns[0]?.dataType).toBe("string");
    expect(config.primaryKeys).toHaveLength(0);
  });
});
