import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household } from "@trove/db/schema/household";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";

import { createTestDb } from "../test-support/db";

const migrationSql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../db/src/migrations/0007_postgres_baseline.sql",
  ),
  "utf8",
);
const upgradeSql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../db/src/migrations/0008_powersync_row_ids.sql",
  ),
  "utf8",
);

const legacyBaselineSql = migrationSql.replace(
  /CREATE TABLE "(categories|accounts|transactions)" \([\s\S]*?\n\);/g,
  (definition, tableName: string) => {
    const withoutIdPrimaryKey = definition.replace(
      '"id" text PRIMARY KEY NOT NULL',
      '"id" text NOT NULL',
    );
    if (tableName === "transactions") {
      return withoutIdPrimaryKey.replace(
        '\tCONSTRAINT "transactions_type_valid"',
        '\tCONSTRAINT "transactions_household_id_id_pk" PRIMARY KEY("household_id","id"),\n\tCONSTRAINT "transactions_type_valid"',
      );
    }
    return withoutIdPrimaryKey.replace(
      `CONSTRAINT "${tableName}_household_id_id_unique" UNIQUE("household_id","id")`,
      `CONSTRAINT "${tableName}_household_id_id_pk" PRIMARY KEY("household_id","id")`,
    );
  },
);

const executeMigrationSql = async (client: PGlite, source: string) => {
  for (const statement of source.split("--> statement-breakpoint")) {
    const trimmed = statement.trim();
    if (
      trimmed &&
      !/CREATE ROLE|CREATE PUBLICATION|GRANT |ALTER PUBLICATION|ALTER ROLE/.test(trimmed)
    ) {
      await client.exec(trimmed);
    }
  }
};

const publishedTables = [
  { name: "accounts", table: ledgerAccount },
  { name: "categories", table: category },
  { name: "transactions", table: transaction },
] as const;

const tableDefinition = (tableName: string) => {
  const match = migrationSql.match(
    new RegExp(`CREATE TABLE "${tableName}" \\(([\\s\\S]*?)\\n\\);`),
  );
  expect(match, `missing ${tableName} from the Postgres baseline`).not.toBeNull();
  return match?.[1] ?? "";
};

describe("PowerSync published row identity", () => {
  it.each(publishedTables)("gives $name one text id primary key", ({ name, table }) => {
    const config = getTableConfig(table);
    expect(config.columns.filter((column) => column.primary).map((column) => column.name)).toEqual([
      "id",
    ]);
    expect(config.primaryKeys).toHaveLength(0);

    expect(config.name).toBe(name);
    const definition = tableDefinition(name);
    expect(definition).toContain('"id" text PRIMARY KEY NOT NULL');
    expect(definition).not.toMatch(/PRIMARY KEY\("household_id","id"\)/);
  });

  it("keeps transaction account and category references inside the transaction household", () => {
    const references = getTableConfig(transaction).foreignKeys.map((foreignKey) => {
      const reference = foreignKey.reference();
      return {
        from: reference.columns.map((column) => column.name),
        to: reference.foreignColumns.map((column) => column.name),
        table: getTableConfig(reference.foreignTable).name,
      };
    });

    expect(references).toEqual(
      expect.arrayContaining([
        {
          from: ["household_id", "account_id"],
          to: ["household_id", "id"],
          table: "accounts",
        },
        {
          from: ["household_id", "to_account_id"],
          to: ["household_id", "id"],
          table: "accounts",
        },
        {
          from: ["household_id", "category_id"],
          to: ["household_id", "id"],
          table: "categories",
        },
      ]),
    );
  });

  it("rejects cross-household account and category references in Postgres", async () => {
    const db = await createTestDb();
    await db.insert(user).values([
      { id: "identity-user-1", name: "One", email: "identity-1@example.com" },
      { id: "identity-user-2", name: "Two", email: "identity-2@example.com" },
    ]);
    await db.insert(household).values([
      { id: "identity-house-1", name: "One", createdByUserId: "identity-user-1" },
      { id: "identity-house-2", name: "Two", createdByUserId: "identity-user-2" },
    ]);
    await db.insert(ledgerAccount).values([
      {
        householdId: "identity-house-1",
        id: "identity-account-1",
        name: "One",
        type: "bank",
        createdBy: "identity-user-1",
        updatedBy: "identity-user-1",
      },
      {
        householdId: "identity-house-2",
        id: "identity-account-2",
        name: "Two",
        type: "bank",
        createdBy: "identity-user-2",
        updatedBy: "identity-user-2",
      },
    ]);
    await db.insert(category).values({
      householdId: "identity-house-1",
      id: "identity-category-1",
      name: "One",
      type: "expense",
      createdBy: "identity-user-1",
      updatedBy: "identity-user-1",
    });

    const transactionBase = {
      householdId: "identity-house-2",
      type: "expense" as const,
      amountMinor: 100,
      currency: "USD",
      date: "2026-09-07",
      createdBy: "identity-user-2",
      updatedBy: "identity-user-2",
    };

    await expect(
      db.insert(transaction).values({
        ...transactionBase,
        id: "cross-account",
        accountId: "identity-account-1",
      }),
    ).rejects.toThrow();
    await expect(
      db.insert(transaction).values({
        ...transactionBase,
        id: "cross-category",
        accountId: "identity-account-2",
        categoryId: "identity-category-1",
      }),
    ).rejects.toThrow();
  });

  it("upgrades an already-applied legacy 0007 and is safe to replay", async () => {
    const client = new PGlite();
    await executeMigrationSql(client, legacyBaselineSql);
    await executeMigrationSql(client, upgradeSql);
    await executeMigrationSql(client, upgradeSql);

    const constraints = await client.query<{
      constraint_name: string;
      definition: string;
    }>(`
      SELECT conname AS constraint_name, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid IN (
        'public.accounts'::regclass,
        'public.categories'::regclass,
        'public.transactions'::regclass
      )
    `);
    const definitions = Object.fromEntries(
      constraints.rows.map((row) => [row.constraint_name, row.definition]),
    );

    expect(definitions.accounts_pkey).toBe("PRIMARY KEY (id)");
    expect(definitions.categories_pkey).toBe("PRIMARY KEY (id)");
    expect(definitions.transactions_pkey).toBe("PRIMARY KEY (id)");
    expect(definitions.accounts_household_id_id_unique).toBe("UNIQUE (household_id, id)");
    expect(definitions.categories_household_id_id_unique).toBe("UNIQUE (household_id, id)");
    expect(Object.values(definitions)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("FOREIGN KEY (household_id, account_id)"),
        expect.stringContaining("FOREIGN KEY (household_id, to_account_id)"),
        expect.stringContaining("FOREIGN KEY (household_id, category_id)"),
      ]),
    );
  });
});
