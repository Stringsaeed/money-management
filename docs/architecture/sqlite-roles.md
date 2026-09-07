# SQLite roles

Device SQLite is money authority only while `selection.kind === "local"`.
When the device is synced (including `offline_cached` / kill switch), Accounts, Categories, and Transactions live on the server.
Synced Accounts, Categories, Transactions, upload metadata, and rejected changes live in PowerSync-managed SQLite.

This table is generated from `tools/oxlint/ledger-boundary/allowlist.ts`.
Edit the allowlist, not this file.

| Role               | File                                                           | Reason                                                                                                                     | Issue |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----- |
| `authority-local`  | `apps/mobile/modules/ledger-data-source/local.ts`              | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/ledger-data-source/local-accounts.ts`     | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/ledger-data-source/local-categories.ts`   | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/ledger-data-source/local-transactions.ts` | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/accounts/account-balance.ts`              | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/accounts/account-lifecycle.ts`            | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/accounts/account-deletion.ts`             | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/categories/category-lifecycle.ts`         | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/categories/future-category-mapping.ts`    | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/account-recurring-coordinator.ts`         | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/db/client.ts`                                     | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/db/seed.ts`                                       | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/db/account-lifecycle-migration.ts`                | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/db/category-lifecycle-migration.ts`               | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/db/recurring-rules-migration.ts`                  | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/recurring-rules/persistence.ts`           | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/recurring-rules/validation.ts`            | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/recurring-rules/settlement.ts`            | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/recurring-rules/provider.tsx`             | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/activation.ts`                  | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/account-dependencies.ts`        | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/account-dependency-read.ts`     | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/envelope-form-options.ts`       | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/envelope-mappings.ts`           | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/envelope-projection.ts`         | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/envelope-resources.ts`          | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/envelope-validation.ts`         | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/funding-account-suggestions.ts` | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/funding-membership.ts`          | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/funding-pool-calculation.ts`    | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/projection.ts`                  | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/setup-draft-suggestions.ts`     | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/modules/budgeting/setup-draft-validation.ts`      | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/hooks/use-budgeting-coordinator.ts`               | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `authority-local`  | `apps/mobile/hooks/use-setup-draft.ts`                         | Anonymous / unmigrated ledger and local-only domain implementation. Synced callers route through PowerSync-aware adapters. | #181  |
| `powersync-store`  | `apps/mobile/modules/powersync/database.ts`                    | PowerSync-managed SQLite and local-only rejection rows. Never the local ledger tables.                                     | #180  |
| `powersync-store`  | `apps/mobile/modules/powersync/rejected-changes.ts`            | PowerSync-managed SQLite and local-only rejection rows. Never the local ledger tables.                                     | #180  |
| `powersync-store`  | `apps/mobile/modules/ledger-db/collections.ts`                 | PowerSync-managed SQLite and local-only rejection rows. Never the local ledger tables.                                     | #180  |
| `migration-backup` | `apps/mobile/lib/migration/chunks.ts`                          | Reads local A/C/T once to build import_bundle chunks; keeps the #98 backup.                                                | #136  |
| `migration-backup` | `apps/mobile/lib/migration/manifest.ts`                        | Reads local A/C/T once to build import_bundle chunks; keeps the #98 backup.                                                | #136  |
| `migration-backup` | `apps/mobile/hooks/use-enable-sync.ts`                         | Reads local A/C/T once to build import_bundle chunks; keeps the #98 backup.                                                | #136  |
| `erase`            | `apps/mobile/components/settings/use-erase-local-data.ts`      | Erase / force-seed. Both refuse when selection.kind === "synced".                                                          | #136  |
| `erase`            | `apps/mobile/components/settings/dev-tools-section.tsx`        | Erase / force-seed. Both refuse when selection.kind === "synced".                                                          | #136  |
