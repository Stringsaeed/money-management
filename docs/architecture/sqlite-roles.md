# SQLite roles

Device SQLite is money authority only while `selection.kind === "local"`.
When the device is synced (including `offline_cached` / kill switch), Accounts, Categories, and Transactions live on the server.
The device may still hold `app_settings` snapshots, `outbox_commands`, and `sync_state`.

This table is generated from `tools/oxlint/ledger-boundary/allowlist.ts`.
Edit the allowlist, not this file.

| Role | File | Reason | Issue |
| --- | --- | --- | --- |
| `authority-local` | `apps/mobile/modules/ledger-data-source/local.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/modules/ledger-data-source/local-accounts.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/modules/ledger-data-source/local-categories.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/modules/ledger-data-source/local-transactions.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/modules/accounts/account-balance.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/modules/accounts/account-lifecycle.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/modules/accounts/account-deletion.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/modules/categories/category-lifecycle.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/modules/categories/future-category-mapping.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/modules/account-recurring-coordinator.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/db/client.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/db/seed.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/db/account-lifecycle-migration.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/db/category-lifecycle-migration.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `authority-local` | `apps/mobile/db/recurring-rules-migration.ts` | Anonymous / unmigrated ledger. The only writers of A/C/T rows as truth. | #136 |
| `snapshot-cache` | `apps/mobile/modules/ledger-data-source/synced-transaction-snapshot.ts` | app_settings JSON snapshot of the last server list. Never A/C/T tables. | #136 |
| `outbox` | `apps/mobile/lib/sync/outbox.ts` | outbox_commands + sync_state watermark. Never A/C/T tables as money authority. | #136 |
| `migration-backup` | `apps/mobile/lib/migration/chunks.ts` | Reads local A/C/T once to build import_bundle chunks; keeps the #98 backup. | #136 |
| `migration-backup` | `apps/mobile/lib/migration/manifest.ts` | Reads local A/C/T once to build import_bundle chunks; keeps the #98 backup. | #136 |
| `migration-backup` | `apps/mobile/hooks/use-enable-sync.ts` | Reads local A/C/T once to build import_bundle chunks; keeps the #98 backup. | #136 |
| `sync-bookkeeping` | `apps/mobile/modules/ledger-data-source/coordinator.ts` | Passes the raw db handle to snapshot/outbox drain. Touch outbox_commands only. | #136 |
| `sync-bookkeeping` | `apps/mobile/hooks/use-sync-worker.ts` | Passes the raw db handle to snapshot/outbox drain. Touch outbox_commands only. | #136 |
| `sync-bookkeeping` | `apps/mobile/hooks/use-rejected-changes.ts` | Passes the raw db handle to snapshot/outbox drain. Touch outbox_commands only. | #136 |
| `sync-bookkeeping` | `apps/mobile/components/rejected-changes/use-rejected-edit-form.ts` | Passes the raw db handle to snapshot/outbox drain. Touch outbox_commands only. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/recurring-rules/persistence.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/recurring-rules/validation.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/recurring-rules/settlement.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/recurring-rules/provider.tsx` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/activation.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/account-dependencies.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/account-dependency-read.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/envelope-form-options.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/envelope-mappings.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/envelope-projection.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/envelope-resources.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/envelope-validation.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/funding-account-suggestions.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/funding-membership.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/funding-pool-calculation.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/projection.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/setup-draft-suggestions.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/modules/budgeting/setup-draft-validation.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/hooks/use-budget-workspaces.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/hooks/use-move-money.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/hooks/use-setup-draft.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `legacy-local-pending-cutover` | `apps/mobile/components/envelopes/use-move-money-sheet.ts` | Recurring Rules + Envelopes still read local A/C/T. Fail-closed at runtime when selection.kind === "synced". Tracked as #136 leftover until those milestones cut over. | #136 |
| `erase` | `apps/mobile/components/settings/use-erase-local-data.ts` | Erase / force-seed. Both refuse when selection.kind === "synced". | #136 |
| `erase` | `apps/mobile/components/settings/dev-tools-section.tsx` | Erase / force-seed. Both refuse when selection.kind === "synced". | #136 |
