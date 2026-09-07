export type SqliteRole = "authority-local" | "powersync-store" | "migration-backup" | "erase";

export type SqliteRoleEntry = {
  role: SqliteRole;
  files: string[];
  reason: string;
  issue: number;
};

export const ENTITY_TABLE_EXPORTS = ["accounts", "categories", "transactions"] as const;

export const ENTITY_TABLE_MESSAGE =
  '`accounts`, `categories`, `transactions` from "@/db/schema" are the anonymous local ledger, not the synced one. Read/write through useAccountDataSource / useCategoryDataSource / useTransactionDataSource (modules/ledger-data-source). If this file is a legitimate SQLite role, add it to tools/oxlint/ledger-boundary/allowlist.ts with a role and a reason.';

export const RAW_DB_MESSAGE =
  "`useDatabase` / `useSQLiteContext` hand out the raw device database. Only allowlisted SQLite roles may hold it. See tools/oxlint/ledger-boundary/allowlist.ts.";

export const LOCAL_PORT_MESSAGE =
  "Local ledger ports are private to the coordinator and the local adapter. Use useAccountDataSource / useCategoryDataSource / useTransactionDataSource, or allowlist this file in tools/oxlint/ledger-boundary/allowlist.ts.";

export const AUTH_CLIENT_RESTRICTION = {
  name: "@/lib/auth-client",
  message: "authClient is private to modules/access. Use useAccess() or access actions.",
} as const;

export const LEDGER_RESTRICTED_IMPORTS = {
  paths: [
    AUTH_CLIENT_RESTRICTION,
    {
      name: "@/db/schema",
      importNames: [...ENTITY_TABLE_EXPORTS],
      allowTypeImports: true,
      message: ENTITY_TABLE_MESSAGE,
    },
    {
      name: "@/db/client",
      importNames: ["useDatabase"],
      message: RAW_DB_MESSAGE,
    },
    {
      name: "@/db/sqlite",
      importNames: ["useSQLiteContext"],
      message: RAW_DB_MESSAGE,
    },
    {
      name: "@/modules/ledger-data-source/local",
      message: LOCAL_PORT_MESSAGE,
    },
  ],
  patterns: [
    {
      group: ["@/modules/ledger-data-source/local-*"],
      message: LOCAL_PORT_MESSAGE,
    },
  ],
} as const;

export type OxlintOverride = {
  files: string[];
  rules: Record<string, unknown>;
};

export const LEDGER_SQLITE_ALLOWLIST: SqliteRoleEntry[] = [
  {
    role: "authority-local",
    files: [
      "apps/mobile/modules/ledger-data-source/local.ts",
      "apps/mobile/modules/ledger-data-source/local-accounts.ts",
      "apps/mobile/modules/ledger-data-source/local-categories.ts",
      "apps/mobile/modules/ledger-data-source/local-transactions.ts",
      "apps/mobile/modules/accounts/account-balance.ts",
      "apps/mobile/modules/accounts/account-lifecycle.ts",
      "apps/mobile/modules/accounts/account-deletion.ts",
      "apps/mobile/modules/categories/category-lifecycle.ts",
      "apps/mobile/modules/categories/future-category-mapping.ts",
      "apps/mobile/modules/account-recurring-coordinator.ts",
      "apps/mobile/db/client.ts",
      "apps/mobile/db/seed.ts",
      "apps/mobile/db/account-lifecycle-migration.ts",
      "apps/mobile/db/category-lifecycle-migration.ts",
      "apps/mobile/db/recurring-rules-migration.ts",
      "apps/mobile/modules/recurring-rules/persistence.ts",
      "apps/mobile/modules/recurring-rules/validation.ts",
      "apps/mobile/modules/recurring-rules/settlement.ts",
      "apps/mobile/modules/recurring-rules/provider.tsx",
      "apps/mobile/modules/budgeting/activation.ts",
      "apps/mobile/modules/budgeting/account-dependencies.ts",
      "apps/mobile/modules/budgeting/account-dependency-read.ts",
      "apps/mobile/modules/budgeting/envelope-form-options.ts",
      "apps/mobile/modules/budgeting/envelope-mappings.ts",
      "apps/mobile/modules/budgeting/envelope-projection.ts",
      "apps/mobile/modules/budgeting/envelope-resources.ts",
      "apps/mobile/modules/budgeting/envelope-validation.ts",
      "apps/mobile/modules/budgeting/funding-account-suggestions.ts",
      "apps/mobile/modules/budgeting/funding-membership.ts",
      "apps/mobile/modules/budgeting/funding-pool-calculation.ts",
      "apps/mobile/modules/budgeting/projection.ts",
      "apps/mobile/modules/budgeting/setup-draft-suggestions.ts",
      "apps/mobile/modules/budgeting/setup-draft-validation.ts",
      "apps/mobile/hooks/use-budgeting-coordinator.ts",
      "apps/mobile/hooks/use-setup-draft.ts",
    ],
    reason:
      "Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters.",
    issue: 181,
  },
  {
    role: "powersync-store",
    files: [
      "apps/mobile/modules/powersync/database.ts",
      "apps/mobile/modules/powersync/rejected-changes.ts",
      "apps/mobile/modules/ledger-db/collections.ts",
    ],
    reason:
      "PowerSync-managed SQLite and local-only rejection rows. Never the local ledger tables.",
    issue: 180,
  },
  {
    role: "migration-backup",
    files: [
      "apps/mobile/lib/migration/chunks.ts",
      "apps/mobile/lib/migration/manifest.ts",
      "apps/mobile/hooks/use-enable-sync.ts",
    ],
    reason: "Reads local A/C/T once to build import_bundle chunks; keeps the #98 backup.",
    issue: 136,
  },
  {
    role: "erase",
    files: [
      "apps/mobile/components/settings/use-erase-local-data.ts",
      "apps/mobile/components/settings/dev-tools-section.tsx",
    ],
    reason: 'Erase / force-seed. Both refuse when selection.kind === "synced".',
    issue: 136,
  },
];

export const AUTH_CLIENT_ONLY_IMPORTS = {
  paths: [AUTH_CLIENT_RESTRICTION],
} as const;

export function ledgerBoundaryOverrides(): OxlintOverride[] {
  return LEDGER_SQLITE_ALLOWLIST.map((entry) => ({
    files: entry.files,
    rules: {
      "no-restricted-imports": ["error", AUTH_CLIENT_ONLY_IMPORTS],
      "ledger-boundary/no-raw-entity-sql": "off",
    },
  }));
}

export function allowlistFilePaths(): string[] {
  return LEDGER_SQLITE_ALLOWLIST.flatMap((entry) => entry.files);
}

export function formatSqliteRolesMarkdown(): string {
  const headers = ["Role", "File", "Reason", "Issue"];
  const rows = LEDGER_SQLITE_ALLOWLIST.flatMap((entry) =>
    entry.files.map((file) => [
      `\`${entry.role}\``,
      `\`${file}\``,
      entry.reason,
      `#${entry.issue}`,
    ]),
  );
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => row[column]!.length)),
  );
  const formatRow = (row: string[]) =>
    `| ${row.map((cell, column) => cell.padEnd(widths[column]!)).join(" | ")} |`;
  return [
    "# SQLite roles",
    "",
    'Device SQLite is money authority only while `selection.kind === "local"`.',
    "When the device is synced (including `offline_cached` / kill switch), Accounts, Categories, and Transactions live on the server.",
    "Synced Accounts, Categories, Transactions, upload metadata, and rejected changes live in PowerSync-managed SQLite.",
    "",
    "This table is generated from `tools/oxlint/ledger-boundary/allowlist.ts`.",
    "Edit the allowlist, not this file.",
    "",
    formatRow(headers),
    formatRow(widths.map((width) => "-".repeat(width))),
    ...rows.map(formatRow),
    "",
  ].join("\n");
}
