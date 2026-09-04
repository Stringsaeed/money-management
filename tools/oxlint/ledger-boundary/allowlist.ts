export type SqliteRole =
  | "authority-local"
  | "snapshot-cache"
  | "outbox"
  | "migration-backup"
  | "sync-bookkeeping"
  | "legacy-local-pending-cutover"
  | "erase";

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
      name: "expo-sqlite",
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
    ],
    reason: "Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth.",
    issue: 136,
  },
  {
    role: "snapshot-cache",
    files: ["apps/mobile/modules/ledger-data-source/synced-transaction-snapshot.ts"],
    reason: "app_settings JSON snapshot of the last server list. Never A/C/T tables.",
    issue: 136,
  },
  {
    role: "outbox",
    files: ["apps/mobile/lib/sync/outbox.ts"],
    reason: "outbox_commands + sync_state watermark. Never A/C/T tables as money authority.",
    issue: 136,
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
    role: "sync-bookkeeping",
    files: [
      "apps/mobile/modules/ledger-data-source/coordinator.ts",
      "apps/mobile/hooks/use-sync-worker.ts",
      "apps/mobile/hooks/use-rejected-changes.ts",
      "apps/mobile/components/rejected-changes/use-rejected-edit-form.ts",
    ],
    reason: "Passes the raw db handle to snapshot/outbox drain. Touch outbox_commands only.",
    issue: 136,
  },
  {
    role: "legacy-local-pending-cutover",
    files: [
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
      "apps/mobile/hooks/use-budget-workspaces.ts",
      "apps/mobile/hooks/use-move-money.ts",
      "apps/mobile/hooks/use-setup-draft.ts",
      "apps/mobile/components/envelopes/use-move-money-sheet.ts",
    ],
    reason:
      'Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over.',
    issue: 136,
  },
  {
    role: "erase",
    files: [
      "apps/mobile/app/(tabs)/settings/index.tsx",
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
