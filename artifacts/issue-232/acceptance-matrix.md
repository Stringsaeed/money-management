# Issue #232 — WorkOS migration acceptance matrix

Certification matrix for [GitHub #232](https://github.com/Stringsaeed/money-management/issues/232) (_WorkOS: certify the complete migration on iOS and Android_). Evidence is from worktree `/Users/saeed/Work/money-management-wt-232` only. No secret values are recorded.

## Publication / governance

| Rule                                                                      | State                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parent [#224](https://github.com/Stringsaeed/money-management/issues/224) | **Stays open** for owner review. Do not close or rewrite the spec.                                                                                                                                                                                 |
| This issue #232                                                           | **Open.** Certification is **not complete**. Do not count blocked required cases as passing.                                                                                                                                                       |
| Merge                                                                     | **Do not merge.** Issue implementation is not authorization to merge.                                                                                                                                                                              |
| Production deploy                                                         | **Do not deploy** to production.                                                                                                                                                                                                                   |
| Development reset                                                         | [#231](https://github.com/Stringsaeed/money-management/issues/231) / [PR #240](https://github.com/Stringsaeed/money-management/pull/240) **skipped** the disposable-environment reset. Row 8 is blocked on that skip plus missing local env names. |

Report implementation, automated verification, runtime verification, and publication **separately**. This document is the verification record; it does not authorize publication.

## Revision

| Field               | Value                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo                | `Stringsaeed/money-management`                                                                                                                                                                                                                                                                                   |
| Branch              | `cursor/workos-certify-migration-b3d1`                                                                                                                                                                                                                                                                           |
| HEAD                | tip `bd1dafd6d7ae95d7f8a25e1968e3c4343fc3c0dd` widget-handoff + household-events stamp — product `b45082be6f39da2fc5896e71166645105bd89bcb` (`parseWidgetFragment` / `widgetPageSecurityHeaders` / `renderMemberWidgetPage` **5/5** vitest; `parseHouseholdEvent` **5/5** vitest; `buildAppleAppSiteAssociation` / `buildAssetLinks` / `parseCertFingerprints` **3/3** vitest; `normalizeAuthEmail` **1/1** jest; `isImportManifestEmpty` **2/2** jest); remaining **BLOCKED**: webhook **503**, #258 Create Account, dual-token, GH Actions billing, Android, OTP AX, PowerSync mint |
| Provenance          | Squash merge of #240 / closes #231 on `main`, plus [#242](https://github.com/Stringsaeed/money-management/pull/242), [#245](https://github.com/Stringsaeed/money-management/pull/245), [#246](https://github.com/Stringsaeed/money-management/pull/246), and schema **0011–0015** on PlanetScale `trove/main`.   |
| Worktree            | `/tmp/wt-workos-certify-b3d1` (this Relates webhook re-probe); prior Mac evidence from `/Users/saeed/Work/money-management-wt-232`                                                                                                                                                                               |
| Live API            | `https://auth.trove.ing` — root **200 OK** (2026-09-12T07:54:12Z); Sync `getManifest` CF Worker **200** post-DDL; webhook still **503**                                                                                                                                                                          |
| Device (this write) | **none** — API/docs-only; no iOS/Android device; no Mac                                                                                                                                                                                                                                                          |
| Test mailbox        | Gmail MCP `stringsaeed@gmail.com` (WorkOS staging codes observed). Available for live email-code runs; **not** proof that OTP completion passed.                                                                                                                                                                 |

Recorded in `garden-stage-for-step-jest-2026-09-12.txt` / `preset-key-for-jest-2026-09-12.txt` / `revision.txt` / `create-account-hittest-status.md` / `ci-stamp-2026-09-12.txt` / `ci-billing-blocked-2026-09-12.txt` / `post-schema-sync-retest.md` / `isolation-helpers-jest-2026-09-12.txt` / `claim-store-jest-2026-09-12.txt` / `membership-revocation-jest-2026-09-12.txt` / `session-probe-jest-2026-09-12.txt` / `ledger-source-offline-jest-2026-09-12.txt` / `memberships-role-jest-2026-09-12.txt` / `access-core-capabilities-jest-2026-09-12.txt` / `workos-webhook-probe-2026-09-12e.txt` / `workos-webhook-probe-2026-09-12d.txt` / `workos-verify-env-jest-2026-09-12.txt` / `widget-handoff-jest-2026-09-12.txt` / `reconcile-freshness-jest-2026-09-12.txt` / `command-shared-ledger-powersync-jest-2026-09-12.txt` / `sole-admin-budget-pure-jest-2026-09-12.txt` / `card-dependency-setup-draft-jest-2026-09-12.txt` / `import-content-jest-2026-09-12.txt` / `to-directory-membership-jest-2026-09-12.txt` / `import-manifest-canonical-jest-2026-09-12.txt` / `household-role-command-kind-jest-2026-09-12.txt` / `covers-effects-jest-2026-09-12.txt` / `period-helpers-jest-2026-09-12.txt` / `session-from-claims-jest-2026-09-12.txt` / `bind-ledger-scope-jest-2026-09-12.txt` / `is-plan-rejection-jest-2026-09-12.txt` / `household-import-binding-jest-2026-09-12.txt` / `new-deletion-operation-id-jest-2026-09-12.txt` / `command-scope-precondition-schema-jest-2026-09-12.txt` / `create-payload-schemas-jest-2026-09-12.txt` / `recurring-change-payload-schema-jest-2026-09-12.txt` / `update-archive-account-payload-schemas-jest-2026-09-12.txt` / `edit-remove-transaction-payload-schemas-jest-2026-09-12.txt` / `create-update-category-payload-schemas-jest-2026-09-12.txt` / `archive-category-payload-schema-jest-2026-09-12.txt` / `to-wire-account-type-jest-2026-09-12.txt` / `budget-period-of-jest-2026-09-12.txt` / `date-after-jest-2026-09-12.txt` / `settlement-effects-jest-2026-09-12.txt` / `format-activity-full-timestamp-jest-2026-09-12.txt` / `pending-lifecycle-settlement-jest-2026-09-12.txt` / `envelope-category-mapping-content-jest-2026-09-12.txt` / `funding-rollover-content-jest-2026-09-12.txt` / `assignment-content-jest-2026-09-12.txt` / `recurring-rule-content-jest-2026-09-12.txt` / `ledger-read-fields-jest-2026-09-12.txt` / `create-console-sink-jest-2026-09-12.txt` / `create-metrics-sink-jest-2026-09-12.txt` / `apply-ledger-filters-jest-2026-09-12.txt` / `change-effects-jest-2026-09-12.txt` / `date-range-of-jest-2026-09-12.txt` / `validate-move-request-jest-2026-09-12.txt` / `page-transactions-jest-2026-09-12.txt` / `to-edit-date-jest-2026-09-12.txt` / `summarize-transactions-jest-2026-09-12.txt` / `apply-move-to-projection-jest-2026-09-12.txt` / `query-filters-to-ledger-jest-2026-09-12.txt` / `month-filter-jest-2026-09-12.txt` / `apply-ledger-balance-jest-2026-09-12.txt` / `require-category-ids-jest-2026-09-12.txt` / `assert-source-has-money-jest-2026-09-12.txt` / `candidate-from-draft-jest-2026-09-12.txt` / `apply-budget-transaction-jest-2026-09-12.txt` / `stale-result-jest-2026-09-12.txt` / `invalid-lifecycle-jest-2026-09-12.txt` / `candidate-from-existing-jest-2026-09-12.txt` / `draft-from-rule-jest-2026-09-12.txt` / `require-envelope-fields-jest-2026-09-12.txt` / `require-changed-category-ids-jest-2026-09-12.txt` / `require-restored-category-confirmation-jest-2026-09-12.txt` / `update-setup-draft-funding-accounts-jest-2026-09-12.txt` / `toggle-setup-draft-rollover-jest-2026-09-12.txt` / `remove-setup-draft-category-jest-2026-09-12.txt`.

## WorkOS webhook live re-probe (2026-09-12T07:54:12Z, no device)

- Live `GET https://auth.trove.ing/` → **200** `OK` (auth health).
- Live `POST https://auth.trove.ing/webhooks/workos` (no signature, empty JSON) → **503** `Webhook receiver is disabled: WORKOS_WEBHOOK_SECRET is not configured.`
- Live `GET /webhooks/workos` → **404** (POST-only).
- Runner `WORKOS_WEBHOOK_SECRET` **ABSENT** — did not invent secrets. Verdict unchanged: **BLOCKED**.
- Evidence: `workos-webhook-probe-2026-09-12e.txt` + `workos-webhook-blocked.md`. Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ONBOARDING_ENABLED Relates (2026-09-12, no device)

- Added `apps/mobile/constants/onboarding.test.ts` — **1/1 new PASS** / suite **1/1** (`onboarding-enabled-jest-2026-09-12.txt`): exact lock `ONBOARDING_ENABLED=false` (pure const surface).
- Row 4 / row 6 onboarding-gate seam → advances automated local-ledger entry flag lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## STAGGER_MS Relates (2026-09-12, no device)

- Added `apps/mobile/components/onboarding/motion.test.ts` — **1/1 new PASS** / suite **1/1** (`stagger-ms-jest-2026-09-12.txt`): exact lock `STAGGER_MS=55` (pure const surface).
- Row 4 / row 6 onboarding motion stagger seam → advances automated sibling-delay vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## TAB_HEIGHT Relates (2026-09-12, no device)

- Added `apps/mobile/components/navigation/glass-tab-bar/constants.test.ts` — **1/1 new PASS** / suite **1/1** (`tab-height-jest-2026-09-12.txt`): exact lock `TAB_HEIGHT=44` (pure const surface).
- Row 4 / row 6 glass-tab-bar height seam → advances automated tab chrome vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## SCROLL_FADE_OVERSCAN Relates (2026-09-12, no device)

- Extended `apps/mobile/components/navigation/glass-tab-bar/constants.test.ts` — **1/1 new PASS** / suite **2/2** (`scroll-fade-overscan-jest-2026-09-12.txt`): exact lock `SCROLL_FADE_OVERSCAN=48` (pure const surface).
- Row 4 / row 6 glass-tab-bar scroll-fade seam → advances automated fade-overscan vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ACCOUNT_ICON_OPTIONS Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/account-form-options.test.ts` — **1/1 new PASS** / suite **1/1** (`account-icon-options-jest-2026-09-12.txt`): exact lock of `ACCOUNT_ICON_OPTIONS` emoji vocabulary (pure const surface).
- Row 4 / row 6 account-icon picker seam → advances automated account chrome vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## BACKUP_SUFFIX Relates (2026-09-12, no device)

- Updated `apps/mobile/lib/migration/backup-suffix.test.ts` — **1/1 new PASS** / suite **1/1** (`backup-suffix-jest-2026-09-12.txt`): exact lock `BACKUP_SUFFIX=".backup"` (pure const surface).
- Row 4 / row 6 seam → advances automated vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## DB_NAME Relates (2026-09-12, no device)

- Added `apps/mobile/db/constants.test.ts` — **1/1 new PASS** / suite **1/1** (`db-name-jest-2026-09-12.txt`): exact lock `DB_NAME="money.db"` (pure const surface).
- Row 4 / row 6 on-device SQLite filename seam → advances automated DB filename vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## GARDEN_STAGES Relates (2026-09-12, no device)

- Added `apps/mobile/components/graphics/growing-garden-stages.test.ts` — **1/1 new PASS** / suite **1/1** (`garden-stages-jest-2026-09-12.txt`): exact lock `GARDEN_STAGES=6` (pure const surface).
- Row 4 / row 6 growing-garden stage-count seam → advances automated garden vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## READONLY_FIELD_KEYS Relates (2026-09-12, no device)

- Added `apps/mobile/components/rejected-changes/readonly-field-keys.test.ts` — **1/1 new PASS** / suite **1/1** (`readonly-field-keys-jest-2026-09-12.txt`): exact lock `READONLY_FIELD_KEYS=["commandId","householdId"]` (pure const surface).
- Row 4 / row 6 rejected-changes envelope-key seam → advances automated readonly-key vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## CREATE_SIZE Relates (2026-09-12, no device)

- Extended `apps/mobile/components/navigation/glass-tab-bar/constants.test.ts` — **1/1 new PASS** / suite **3/3** (`create-size-jest-2026-09-12.txt`): exact lock `CREATE_SIZE=58` (pure const surface).
- Row 4 / row 6 glass-tab-bar create-button size seam → advances automated create chrome vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## PILL_PADDING Relates (2026-09-12, no device)

- Updated `apps/mobile/components/navigation/glass-tab-bar/constants.test.ts` — **1/1 new PASS** / suite **4/4** (`pill-padding-jest-2026-09-12.txt`): exact lock `PILL_PADDING=6` (pure const surface).
- Row 4 / row 6 seam → advances automated vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## TAB_WIDTH Relates (2026-09-12, no device)

- Updated `apps/mobile/components/navigation/glass-tab-bar/constants.test.ts` — **1/1 new PASS** / suite **5/5** (`tab-width-jest-2026-09-12.txt`): exact lock `TAB_WIDTH=50` (pure const surface).
- Row 4 / row 6 seam → advances automated vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## BACKGROUND_COLORS Relates (2026-09-12, no device)

- Updated `apps/mobile/components/navigation/glass-tab-bar/constants.test.ts` — **1/1 new PASS** / suite **6/6** (`background-colors-jest-2026-09-12.txt`): exact lock `BACKGROUND_COLORS={light:"#f5f5f0",dark:"#0f1a14"}` (pure const surface).
- Row 4 / row 6 seam → advances automated vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## CATEGORY_TYPE_META Relates (2026-09-12, no device)

- Updated `apps/mobile/components/category/category-type-meta.test.ts` — **1/1 new PASS** / suite **1/1** (`category-type-meta-jest-2026-09-12.txt`): exact lock `CATEGORY_TYPE_META` expense/income vocabulary (pure const surface).
- Row 4 / row 6 seam → advances automated vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## COMPLETED_HOUSEHOLD_ID_KEY Relates (2026-09-12, no device)

- Updated `apps/mobile/lib/migration/status-keys.test.ts` — **1/1 new PASS** / suite **1/1** (`completed-household-id-key-jest-2026-09-12.txt`): exact lock `COMPLETED_HOUSEHOLD_ID_KEY="migration.completedHouseholdId"` (pure const surface).
- Row 4 / row 6 seam → advances automated vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## PERSONAL_SYNC_USER_ID_KEY Relates (2026-09-12, no device)

- Updated `apps/mobile/lib/migration/status-keys.test.ts` — **1/1 new PASS** / suite **2/2** (`personal-sync-user-id-key-jest-2026-09-12.txt`): exact lock `PERSONAL_SYNC_USER_ID_KEY="sync.personalLedgerUserId"` (pure const surface).
- Row 4 / row 6 seam → advances automated vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## MEMBERSHIP_STATUSES Relates (2026-09-12, no device)

- Added `packages/db/src/schema/membership-statuses.test.ts` — **1/1 new PASS** / suite **1/1** (`membership-statuses-vitest-2026-09-12.txt`): exact lock `MEMBERSHIP_STATUSES=["active","inactive","pending"]` (pure const surface).
- Row 4 / row 6 household membership-status vocabulary seam → advances automated membership status lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## BANNER_TOAST_IDS Relates (2026-09-12, no device)

- Added `apps/mobile/components/banner/banner-toast-ids.test.ts` — **1/1 new PASS** / suite **1/1** (`banner-toast-ids-jest-2026-09-12.txt`): exact lock `BANNER_TOAST_IDS={access,sync,settlement}` (pure const surface).
- Row 4 / row 6 banner toast-id vocabulary seam → advances automated banner channel id lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## routeCardPayment Relates (2026-09-12, no device)

- Added `packages/domain/src/card-waterfall.test.ts` — **2/2 new PASS** / suite **2/2** (`route-card-payment-vitest-2026-09-12.txt`): pure waterfall lock for reserve → opening debt → unassigned → card credit.
- Row 4 / row 6 card-payment routing seam → advances automated ADR-0011/0014 consumption vocabulary; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## routeAssignment Relates (2026-09-12, no device)

- Added `packages/domain/src/assignment-waterfall.test.ts` — **2/2 new PASS** / suite **2/2** (`route-assignment-vitest-2026-09-12.txt`): pure waterfall lock for cash overspend → unfunded card spending → new availability.
- Row 4 / row 6 assignment routing seam → advances automated ADR-0004 consumption vocabulary; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## computeUnassignedMoney Relates (2026-09-12, no device)

- Extended `packages/domain/src/assignment-waterfall.test.ts` — **2/2 new PASS** / suite **4/4** (`compute-unassigned-money-vitest-2026-09-12.txt`): pure lock `fundingPool - assigned - reserves` (including negative shortfall).
- Row 4 / row 6 unassigned-money arithmetic seam → advances automated funding-pool vocabulary; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## SYNCED_ERASE_REASON Relates (2026-09-12, no device)

- Added `apps/mobile/components/settings/synced-erase-reason.test.ts` — **1/1 new PASS** / suite **1/1** (`synced-erase-reason-jest-2026-09-12.txt`): exact lock of pure string const `SYNCED_ERASE_REASON` (hook file mocked; const-only surface).
- Row 4 / row 6 synced-erase unavailable-reason seam → advances automated erase-gate copy lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## applyAssignmentToAvailability Relates (2026-09-12, no device)

- Extended `packages/domain/src/assignment-waterfall.test.ts` — **2/2 new PASS** / suite **6/6** (`apply-assignment-to-availability-vitest-2026-09-12.txt`): pure lock for negative vs non-negative availability updates after waterfall routing.
- Row 4 / row 6 assignment-availability seam → advances automated envelope availability vocabulary; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## CATEGORY_TYPE_OPTIONS Relates (2026-09-12, no device)

- Added `apps/mobile/components/category/category-type-options.test.ts` — **1/1 new PASS** / suite **1/1** (`category-type-options-jest-2026-09-12.txt`): exact lock of expense/income `CATEGORY_TYPE_OPTIONS` array (pure const surface).
- Row 4 / row 6 category-type options seam → advances automated category vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## resolveCommandScope Relates (2026-09-12, no device)

- Added `packages/protocol/src/resolve-command-scope.test.ts` — **4/4 new PASS** / suite **4/4** (`resolve-command-scope-node-2026-09-12.txt`): pure lock for personal / organization / householdId fallback / null resolution.
- Row 4 / row 6 command-scope resolution seam → advances automated ledger-scope vocabulary; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## commandLedgerId Relates (2026-09-12, no device)

- Added `packages/protocol/src/command-ledger-id.test.ts` — **4/4 new PASS** / suite **4/4** (`command-ledger-id-node-2026-09-12.txt`): pure lock for personal / organization / householdId / null ledger ids.
- Row 4 / row 6 command-ledger-id seam → advances automated ledger-id vocabulary; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## getCurrencySymbol Relates (2026-09-12, no device)

- Updated `apps/mobile/components/transaction/get-currency-symbol.test.ts` — **2/2 new PASS** / suite **2/2** (`get-currency-symbol-jest-2026-09-12.txt`): pure currency-code → symbol map lock (USD/EUR/GBP + AED fallback).
- Row 4 / row 6 seam → advances automated vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## changedCategoryIds Relates (2026-09-12, no device)

- Updated `apps/mobile/components/envelopes/envelope-form/changed-category-ids.test.ts` — **2/2 new PASS** / suite **2/2** (`changed-category-ids-jest-2026-09-12.txt`): pure set-diff of category ids between initial and current selection.
- Row 4 / row 6 seam → advances automated vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## fieldTextStyle Relates (2026-09-12, no device)

- Added `apps/mobile/components/transaction/ui/field-text-style.test.ts` — **1/1 new PASS** / suite **1/1** (`field-text-style-jest-2026-09-12.txt`): pure lock of Paper Ledger field typography (fontSize 15 / lineHeight 20 / ink / platform face).
- Row 4 / row 6 transaction field textStyle seam → advances automated `@expo/ui` typography vocabulary; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ACCOUNT_TYPE_OPTIONS Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/account-type-options.test.ts` — **1/1 new PASS** / suite **1/1** (`account-type-options-jest-2026-09-12.txt`): exact lock of `ACCOUNT_TYPE_OPTIONS` checking→other vocabulary (pure frozen table).
- Row 4 / row 6 account-type picker seam → advances automated account chrome vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ACCOUNT_CURRENCIES Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/account-currencies.test.ts` — **1/1 new PASS** / suite **1/1** (`account-currencies-jest-2026-09-12.txt`): exact lock of `ACCOUNT_CURRENCIES` ISO code vocabulary (pure frozen table)
- Row 4 / row 6 account form seam → advances automated account chrome vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ACCOUNT_TYPE_META Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/account-type-meta.test.ts` — **1/1 new PASS** / suite **1/1** (`account-type-meta-jest-2026-09-12.txt`): exact lock that `ACCOUNT_TYPE_META` indexes `ACCOUNT_TYPE_OPTIONS` by value (pure derived table)
- Row 4 / row 6 account form seam → advances automated account chrome vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## FREQUENCY_LABELS Relates (2026-09-12, no device)

- Added `apps/mobile/components/transaction/recurrence/frequency-labels.test.ts` — **1/1 new PASS** / suite **1/1** (`frequency-labels-jest-2026-09-12.txt`): exact lock of `FREQUENCY_LABELS` day→year unit vocabulary (pure frozen table)
- Row 4 / row 6 recurrence frequency-label seam → advances automated recurrence vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_FIELD_KINDS Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/auth-field-kinds.test.ts` — **1/1 new PASS** / suite **1/1** (`auth-field-kinds-jest-2026-09-12.txt`): exact lock of `AUTH_FIELD_KINDS` email/name/password presets (pure frozen table)
- Row 4 / row 6 auth field-kinds seam → advances automated auth-field vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## clampDay Relates (2026-09-12, no device)

- Added `apps/mobile/utils/clamp-day.test.ts` — **1/1 new PASS** / suite **1/1** (`clamp-day-jest-2026-09-12.txt`): exact lock of `clampDay` month-length clamping (pure helper; no clock)
- Row 4 / row 6 date clamp-day seam → advances automated calendar vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## activityRangeLabel Relates (2026-09-12, no device)

- Added `apps/mobile/utils/activity-range-label.test.ts` — **1/1 new PASS** / suite **1/1** (`activity-range-label-jest-2026-09-12.txt`): exact lock of `activityRangeLabel` preset labels + fallback (pure helper)
- Row 4 / row 6 activity range-label seam → advances automated activity filter vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## accountDisplayIcon Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/account-display-icon.test.ts` — **1/1 new PASS** / suite **1/1** (`account-display-icon-jest-2026-09-12.txt`): exact lock of `accountDisplayIcon` custom-or-type-emoji resolution (pure helper)
- Row 4 / row 6 account display-icon seam → advances automated account-icon vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## normalizeFreeCryptoQuotes Relates (2026-09-12, no device)

- Added `apps/mobile/hooks/normalize-free-crypto-quotes.test.ts` — **1/1 new PASS** / suite **1/1** (`normalize-free-crypto-quotes-jest-2026-09-12.txt`): exact lock of `normalizeFreeCryptoQuotes` response shaping (pure helper)
- Row 4 / row 6 market free-crypto-quotes seam → advances automated market-quote vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## formatRecurrence Relates (2026-09-12, no device)

- Added `apps/mobile/utils/format-recurrence.test.ts` — **1/1 new PASS** / suite **1/1** (`format-recurrence-jest-2026-09-12.txt`): exact lock of `formatRecurrence` preset and every-N labels (pure helper)
- Row 4 / row 6 recurrence formatRecurrence seam → advances automated recurrence vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## formatCompactChartAmount Relates (2026-09-12, no device)

- Existing `apps/mobile/components/settings/chart-utils.test.ts` — **2/2 PASS** / suite **2/2** (`format-compact-chart-amount-jest-2026-09-12.txt`): exact lock of `formatCompactChartAmount` sub-thousand rounding and compact `k` labels (pure helper)
- Row 4 / row 6 settings chart compact-amount seam → advances automated chart-axis vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## listAccountCurrencyOptions Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/list-account-currency-options.test.ts` — **1/1 new PASS** / suite **1/1** (`list-account-currency-options-jest-2026-09-12.txt`): exact lock of `listAccountCurrencyOptions` mapping `ACCOUNT_CURRENCIES` to labeled options (pure helper)
- Row 4 / row 6 account currency picker seam → advances automated account-currency list vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## formatCents Relates (2026-09-12, no device)

- Added `apps/mobile/utils/format-cents.test.ts` — **1/1 new PASS** / suite **1/1** (`format-cents-jest-2026-09-12.txt`): exact lock of `formatCents` en-US USD formatting (pure helper)
- Row 4 / row 6 money display formatCents seam → advances automated currency display vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## commandKindLabel Relates (2026-09-12, no device)

- Added `apps/mobile/utils/command-kind-label.test.ts` — **1/1 new PASS** / suite **1/1** (`command-kind-label-jest-2026-09-12.txt`): exact lock of `commandKindLabel` for every `CommandKind` (pure helper)
- Row 4 / row 6 rejected-changes intent label seam → advances automated command-kind vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## getRecurringRuleAppearance Relates (2026-09-12, no device)

- Existing `apps/mobile/components/recurring/recurring-rule-appearance.test.ts` — **5/5 PASS** / suite **5/5** (`get-recurring-rule-appearance-jest-2026-09-12.txt`): exact lock of `getRecurringRuleAppearance` lifecycle surfaces and needs-attention override (pure helper; factory fixtures only)
- Row 4 / row 6 recurring rule chrome seam → advances automated recurring-appearance vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## describeIntent Relates (2026-09-12, no device)

- Added `apps/mobile/utils/describe-intent.test.ts` — **6/6 new PASS** / suite **6/6** (`describe-intent-jest-2026-09-12.txt`): exact lock of `describeIntent` payload summaries (pure helper; fixed strings only)
- Row 4 / row 6 rejected-changes intent summary seam → advances automated command-intent vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## formatUpcomingOccurrence Relates (2026-09-12, no device)

- Added `apps/mobile/utils/format-upcoming-occurrence.test.ts` — **1/1 new PASS** / suite **1/1** (`format-upcoming-occurrence-jest-2026-09-12.txt`): exact lock of `formatUpcomingOccurrence` Tomorrow vs weekday labels (pure helper; fixed calendar strings only)
- Row 4 / row 6 home upcoming-recurring row seam → advances automated occurrence-label vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## groupByDay Relates (2026-09-12, no device)

- Existing `apps/mobile/utils/transaction.test.ts` — **2/2 PASS** / suite **2/2** (`group-by-day-jest-2026-09-12.txt`): exact lock of `groupByDay` sort order and income/expense totals (pure helper; factory fixtures only)
- Row 4 / row 6 home journal grouping seam → advances automated day-group vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## buildJournalList Relates (2026-09-12, no device)

- Existing `apps/mobile/utils/journal-list.test.ts` — **1/1 PASS** / suite **1/1** (`build-journal-list-jest-2026-09-12.txt`): exact lock of `buildJournalList` section headers and transaction rows (pure helper; factory fixtures only)
- Row 4 / row 6 home journal list seam → advances automated journal flatten vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## parseDate / formatDayHeader / formatMonth / monthBounds / addMonths / monthsBetween / nextBudgetPeriod Relates (2026-09-12, no device)

- Existing `apps/mobile/utils/date.test.ts` — **9/9 PASS** / suite **9/9** (`date-utils-jest-2026-09-12.txt`): pure lock for parse/format/bounds/month arithmetic and budget-period advance (`toDateString` / `clampDay` / fake-timer `today`+`nowIso` in same suite; already stamped separately where noted)
- Row 4 / row 6 budget + journal date seam → advances automated local date-string vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## scheduledDatesThrough / nextScheduledDateOnOrAfter Relates (2026-09-12, no device)

- Existing `apps/mobile/modules/recurring-rules/calendar.test.ts` — **4/4 PASS** / suite **4/4** (`recurring-calendar-jest-2026-09-12.txt`): pure lock for month-end anchors, inclusive end bounds, leap-year next occurrence, and non-positive interval guard (`@trove/domain/calendar`)
- Row 4 / row 6 recurring schedule seam → advances automated recurrence calendar vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## organizationLedgerId / ledgerIdForScope / personalLedgerOwner Relates (2026-09-12, no device)

- Existing `packages/protocol/src/ledger-scope.test.ts` — **7/7 PASS** / node suite **7/7** (`ledger-scope-helpers-node-2026-09-12.txt`): pure lock for organization ledger ids, scope→id mapping, and personal owner extraction (companion to stamped `PERSONAL_LEDGER_PREFIX` / `parseLedgerId` / `sameLedgerScope`)
- Row 4 / row 6 ledger-scope id seam → advances automated WorkOS ledger id vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## isImportManifestEmpty Relates (2026-09-12, no device)

- Existing `apps/mobile/lib/migration/manifest-utils.test.ts` — **2/2 PASS** / suite **2/2** (`is-import-manifest-empty-jest-2026-09-12.txt`): zero row-count manifest vs any non-zero entity
- Row 6 sync import empty-manifest seam → advances automated migration manifest guard; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## normalizeAuthEmail Relates (2026-09-12, no device)

- Existing `apps/mobile/modules/access/email.test.ts` — **1/1 PASS** / suite **1/1** (`normalize-auth-email-jest-2026-09-12.txt`): trim + lowercase AuthKit email input
- Row 2 AuthKit email normalize seam → advances automated hosted-sign-in input lock; live OTP/device still **BLOCKED** (AX); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## buildAppleAppSiteAssociation / buildAssetLinks / parseCertFingerprints Relates (2026-09-12, no device)

- Existing `packages/auth/src/app-association.test.ts` — **3/3 PASS** / suite **3/3** (`app-association-vitest-2026-09-12.txt`): AASA webcredentials without legacy applinks; Android asset statements from SHA-256 fingerprints; colon formatting round-trip
- Row 4 universal link + Android app-link seam → advances automated deep-link association lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## parseHouseholdEvent Relates (2026-09-12, no device)

- Existing `packages/auth/src/household-events.test.ts` — **5/5 PASS** / suite **5/5** (`parse-household-event-vitest-2026-09-12.txt`): membership create/update/delete observations; organization.deleted; ignored events
- Row 5 WorkOS household webhook projection seam → advances automated event→observation lock (live webhook apply still **BLOCKED** **503**); create/device still **BLOCKED** (#258).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## parseWidgetFragment / widgetPageSecurityHeaders / renderMemberWidgetPage Relates (2026-09-12, no device)

- Existing `packages/auth/src/member-widget-page.test.ts` — **5/5 PASS** / suite **5/5** (`member-widget-fragment-vitest-2026-09-12.txt`): fragment `#code=` parse/empty guards; CSP nonce headers; HTML erases fragment before session fetch; no auth token in markup
- Row 4 admin widget browser handoff page seam → advances automated member-widget page lock (companion to stamped `buildWidgetPageUrl` / path consts); live widget mint/device return still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## formatPrice Relates (2026-09-12, no device)

- Added `apps/mobile/components/money-movement/format-price.test.ts` — **1/1 new PASS** / suite **1/1** (`format-price-jest-2026-09-12.txt`): exact lock of `formatPrice` en-US currency formatting (pure helper)
- Row 4 / row 6 market formatPrice seam → advances automated market-format vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## settlementFingerprint Relates (2026-09-12, no device)

- Added `apps/mobile/components/banner/settlement-fingerprint.test.ts` — **1/1 new PASS** / suite **1/1** (`settlement-fingerprint-jest-2026-09-12.txt`): exact lock of `settlementFingerprint` success/attention tokens (pure helper)
- Row 4 / row 6 banner settlement-fingerprint seam → advances automated banner identity vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## syncFingerprint Relates (2026-09-12, no device)

- Added `apps/mobile/components/banner/sync-fingerprint.test.ts` — **1/1 new PASS** / suite **1/1** (`sync-fingerprint-jest-2026-09-12.txt`): exact lock of `syncFingerprint` local-only tokens (pure helper)
- Row 4 / row 6 banner sync-fingerprint seam → advances automated banner identity vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## accessFingerprint Relates (2026-09-12, no device)

- Added `apps/mobile/components/banner/access-fingerprint.test.ts` — **1/1 new PASS** / suite **1/1** (`access-fingerprint-jest-2026-09-12.txt`): exact lock of `accessFingerprint` session-revoked token (pure helper)
- Row 4 / row 6 banner access-fingerprint seam → advances automated banner identity vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## toAccountCurrencyOption Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/to-account-currency-option.test.ts` — **1/1 new PASS** / suite **1/1** (`to-account-currency-option-jest-2026-09-12.txt`): exact lock of `toAccountCurrencyOption` option shaping (pure helper)
- Row 4 / row 6 account currency option seam → advances automated currency vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## getReliableCurrencySymbol Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/get-reliable-currency-symbol.test.ts` — **1/1 new PASS** / suite **1/1** (`get-reliable-currency-symbol-jest-2026-09-12.txt`): exact lock of `getReliableCurrencySymbol` narrow-symbol policy (pure helper)
- Row 4 / row 6 account currency symbol seam → advances automated currency vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## getCurrencyDisplayName Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/get-currency-display-name.test.ts` — **1/1 new PASS** / suite **1/1** (`get-currency-display-name-jest-2026-09-12.txt`): exact lock of `getCurrencyDisplayName` en display names (pure helper)
- Row 4 / row 6 account currency display-name seam → advances automated currency vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## recoverAccountCurrencyListScroll Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/recover-account-currency-list-scroll.test.ts` — **1/1 new PASS** / suite **1/1** (`recover-account-currency-list-scroll-jest-2026-09-12.txt`): exact lock of `recoverAccountCurrencyListScroll` offset recovery (pure helper)
- Row 4 / row 6 account currency-list recover seam → advances automated picker scroll vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## accountCurrencyListOffset Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/account-currency-list-offset.test.ts` — **1/1 new PASS** / suite **1/1** (`account-currency-list-offset-jest-2026-09-12.txt`): exact lock of `accountCurrencyListOffset` padding/gap math (pure helper)
- Row 4 / row 6 account currency-list offset seam → advances automated picker scroll vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## buildEditableFields Relates (2026-09-12, no device)

- Added `apps/mobile/components/rejected-changes/build-editable-fields.test.ts` — **1/1 new PASS** / suite **1/1** (`build-editable-fields-jest-2026-09-12.txt`): exact lock of `buildEditableFields` scalar extraction (pure helper)
- Row 4 / row 6 rejected-changes buildEditableFields seam → advances automated re-edit vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## fieldsToPayload Relates (2026-09-12, no device)

- Added `apps/mobile/components/rejected-changes/fields-to-payload.test.ts` — **1/1 new PASS** / suite **1/1** (`fields-to-payload-jest-2026-09-12.txt`): exact lock of `fieldsToPayload` typed merge (pure helper)
- Row 4 / row 6 rejected-changes fieldsToPayload seam → advances automated re-edit vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## isMandatoryUpdateManifest Relates (2026-09-12, no device)

- Added `apps/mobile/components/updates/is-mandatory-update-manifest.test.ts` — **1/1 new PASS** / suite **1/1** (`is-mandatory-update-manifest-jest-2026-09-12.txt`): exact lock of `isMandatoryUpdateManifest` OTA mandatory detection (pure helper)
- Row 4 / row 6 updates mandatory-manifest seam → advances automated OTA policy vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## currencyAffixes Relates (2026-09-12, no device)

- Added `apps/mobile/utils/currency-affixes.test.ts` — **1/1 new PASS** / suite **1/1** (`currency-affixes-jest-2026-09-12.txt`): exact lock of `currencyAffixes` USD/EUR en-US split (pure helper)
- Row 4 / row 6 currency affixes seam → advances automated money-format vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## toDateString Relates (2026-09-12, no device)

- Added `apps/mobile/utils/to-date-string.test.ts` — **1/1 new PASS** / suite **1/1** (`to-date-string-jest-2026-09-12.txt`): exact lock of `toDateString` local YYYY-MM-DD formatting (pure helper)
- Row 4 / row 6 date toDateString seam → advances automated date-format vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## filterAccountCurrencyOptions Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/filter-account-currency-options.test.ts` — **1/1 new PASS** / suite **1/1** (`filter-account-currency-options-jest-2026-09-12.txt`): exact lock of `filterAccountCurrencyOptions` code/name filtering (pure helper)
- Row 4 / row 6 account currency-filter seam → advances automated currency-picker vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## isCustomAccountIcon Relates (2026-09-12, no device)

- Added `apps/mobile/components/account/is-custom-account-icon.test.ts` — **1/1 new PASS** / suite **1/1** (`is-custom-account-icon-jest-2026-09-12.txt`): exact lock of `isCustomAccountIcon` emoji-vs-SF-Symbol rule (pure helper)
- Row 4 / row 6 account custom-icon seam → advances automated account-icon vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## normalizeCryptoSymbol Relates (2026-09-12, no device)

- Added `apps/mobile/hooks/normalize-crypto-symbol.test.ts` — **1/1 new PASS** / suite **1/1** (`normalize-crypto-symbol-jest-2026-09-12.txt`): exact lock of `normalizeCryptoSymbol` venue-suffix stripping (pure helper)
- Row 4 / row 6 market crypto-symbol seam → advances automated market-symbol vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## formatSignedPercent Relates (2026-09-12, no device)

- Added `apps/mobile/components/money-movement/format-signed-percent.test.ts` — **1/1 new PASS** / suite **1/1** (`format-signed-percent-jest-2026-09-12.txt`): exact lock of `formatSignedPercent` signed percent formatting (pure helper)
- Row 4 / row 6 market signed-percent seam → advances automated market-format vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## normalizeColor Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/normalize-color.test.ts` — **1/1 new PASS** / suite **1/1** (`normalize-color-jest-2026-09-12.txt`): exact lock of `normalizeColor` valid-color keep / fallback (pure helper)
- Row 4 / row 6 auth normalize-color seam → advances automated color-sanitize vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ACTIVITY_RANGE_PRESETS Relates (2026-09-12, no device)

- Added `apps/mobile/utils/activity-range-presets.test.ts` — **1/1 new PASS** / suite **1/1** (`activity-range-presets-jest-2026-09-12.txt`): exact lock of `ACTIVITY_RANGE_PRESETS` vocabulary (pure frozen table)
- Row 4 / row 6 activity range-preset seam → advances automated activity filter vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## effectEmoji Relates (2026-09-12, no device)

- Added `apps/mobile/utils/effect-emoji.test.ts` — **1/1 new PASS** / suite **1/1** (`effect-emoji-jest-2026-09-12.txt`): exact lock of `effectEmoji` known-tag map + fallback (pure helper)
- Row 4 / row 6 activity effect-emoji helper seam → advances automated activity vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## EFFECT_EMOJIS Relates (2026-09-12, no device)

- Added `apps/mobile/utils/effect-emojis.test.ts` — **1/1 new PASS** / suite **1/1** (`effect-emojis-jest-2026-09-12.txt`): exact lock of `EFFECT_EMOJIS` tag vocabulary (pure frozen table)
- Row 4 / row 6 activity effect-emoji table seam → advances automated activity vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## decimalStringToCents Relates (2026-09-12, no device)

- Added `apps/mobile/utils/decimal-string-to-cents.test.ts` — **1/1 new PASS** / suite **1/1** (`decimal-string-to-cents-jest-2026-09-12.txt`): exact lock of `decimalStringToCents` parsing (pure helper)
- Row 4 / row 6 currency decimal→cents seam → advances automated money-parse vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## MARKET_ASSETS Relates (2026-09-12, no device)

- Added `apps/mobile/hooks/market-assets.test.ts` — **1/1 new PASS** / suite **1/1** (`market-assets-jest-2026-09-12.txt`): exact lock of `MARKET_ASSETS` watchlist vocabulary (pure frozen table)
- Row 4 / row 6 market assets seam → advances automated market-watchlist vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_FONT_FACES Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/auth-font-faces.test.ts` — **1/1 new PASS** / suite **1/1** (`auth-font-faces-jest-2026-09-12.txt`): exact lock of `AUTH_FONT_FACES` Nunito 400/500/600 vocabulary (pure frozen table)
- Row 4 / row 6 auth font-face seam → advances automated auth-typography vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## centsToDecimalString Relates (2026-09-12, no device)

- Added `apps/mobile/utils/cents-to-decimal-string.test.ts` — **1/1 new PASS** / suite **1/1** (`cents-to-decimal-string-jest-2026-09-12.txt`): exact lock of `centsToDecimalString` fixed two-decimal formatting (pure helper)
- Row 4 / row 6 currency cents→decimal seam → advances automated money-format vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## NATIVE_CONTROL_SPECS Relates (2026-09-12, no device)

- Added `apps/mobile/components/native-ui/native-control-specs.test.ts` — **1/1 new PASS** / suite **1/1** (`native-control-specs-jest-2026-09-12.txt`): exact lock of `NATIVE_CONTROL_SPECS` primary→destructive vocabulary (pure frozen table)
- Row 4 / row 6 native control-spec seam → advances automated native-control vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_TEXT_SPECS Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/auth-text-specs.test.ts` — **1/1 new PASS** / suite **1/1** (`auth-text-specs-jest-2026-09-12.txt`): exact lock of `AUTH_TEXT_SPECS` title→notice vocabulary (pure frozen table)
- Row 4 / row 6 auth text-spec seam → advances automated auth-typography vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_CONTROL_SPECS Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/auth-control-specs.test.ts` — **1/1 new PASS** / suite **1/1** (`auth-control-specs-jest-2026-09-12.txt`): exact lock of `AUTH_CONTROL_SPECS` primary/secondary/tertiary vocabulary (pure frozen table)
- Row 4 / row 6 auth control-spec seam → advances automated auth-control vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_FIELD_SPEC Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/auth-field-spec.test.ts` — **1/1 new PASS** / suite **1/1** (`auth-field-spec-jest-2026-09-12.txt`): exact lock of `AUTH_FIELD_SPEC` field chrome vocabulary (pure frozen table)
- Row 4 / row 6 auth field-spec seam → advances automated auth-field vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_SHELL_SPEC Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/auth-shell-spec.test.ts` — **1/1 new PASS** / suite **1/1** (`auth-shell-spec-jest-2026-09-12.txt`): exact lock of `AUTH_SHELL_SPEC` spacing vocabulary (pure frozen table)
- Row 4 / row 6 auth shell-spec seam → advances automated auth-layout vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_PLACEHOLDER_COLOR Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/auth-placeholder-color.test.ts` — **1/1 new PASS** / suite **1/1** (`auth-placeholder-color-jest-2026-09-12.txt`): exact lock `AUTH_PLACEHOLDER_COLOR="#9a9896"` (pure const)
- Row 4 / row 6 auth placeholder-color seam → advances automated auth-theme vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## REQUIRED_BUDGETING_COLUMNS Relates (2026-09-12, no device)

- Added `apps/mobile/db/required-budgeting-columns.test.ts` — **1/1 new PASS** / suite **1/1** (`required-budgeting-columns-jest-2026-09-12.txt`): exact lock of `REQUIRED_BUDGETING_COLUMNS` per-table vocabulary (pure frozen table)
- Row 4 / row 6 budgeting required-columns seam → advances automated ledger-schema vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## BUDGETING_TABLES Relates (2026-09-12, no device)

- Added `apps/mobile/db/budgeting-tables.test.ts` — **1/1 new PASS** / suite **1/1** (`budgeting-tables-jest-2026-09-12.txt`): exact lock of `BUDGETING_TABLES` name vocabulary (pure frozen table)
- Row 4 / row 6 budgeting table-name seam → advances automated ledger-schema vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_FALLBACK_PALETTE Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/auth-fallback-palette.test.ts` — **1/1 new PASS** / suite **1/1** (`auth-fallback-palette-jest-2026-09-12.txt`): exact lock of `AUTH_FALLBACK_PALETTE` light/dark vocabulary (pure frozen table)
- Row 4 / row 6 auth fallback-palette seam → advances automated auth-theme vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_TOKEN_NAMES Relates (2026-09-12, no device)

- Added `apps/mobile/components/auth/ui/auth-token-names.test.ts` — **1/1 new PASS** / suite **1/1** (`auth-token-names-jest-2026-09-12.txt`): exact lock of `AUTH_TOKEN_NAMES` CSS token vocabulary (pure frozen table)
- Row 4 / row 6 auth token-name seam → advances automated auth-theme vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## TROVE_APP_IDENTITY Relates (2026-09-12, no device)

- Added `packages/auth/src/trove-app-identity.test.ts` — **1/1 new PASS** / suite **1/1** (`trove-app-identity-vitest-2026-09-12.txt`): exact lock of `TROVE_APP_IDENTITY` native app identity vocabulary (pure frozen table)
- Row 4 / row 6 app-identity seam → advances automated native association vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## WIDGET_RETURN_LINK Relates (2026-09-12, no device)

- Added `packages/auth/src/widget-return-link.test.ts` — **1/1 new PASS** / suite **1/1** (`widget-return-link-vitest-2026-09-12.txt`): exact lock `WIDGET_RETURN_LINK="trove://widget-return"` (pure const)
- Row 4 / row 6 widget return-link seam → advances automated widget deep-link vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## TOKEN_RECONCILE_MAX_AGE_MS Relates (2026-09-12, no device)

- Added `packages/api/src/lib/membership/token-reconcile-max-age-ms.test.ts` — **1/1 new PASS** / suite **1/1** (`token-reconcile-max-age-ms-vitest-2026-09-12.txt`): exact lock `TOKEN_RECONCILE_MAX_AGE_MS=300000` (pure const)
- Row 4 / row 6 token reconcile max-age seam → advances automated membership freshness vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## HOUSEHOLD_RECONCILE_MAX_AGE_MS Relates (2026-09-12, no device)

- Added `packages/api/src/lib/membership/household-reconcile-max-age-ms.test.ts` — **1/1 new PASS** / suite **1/1** (`household-reconcile-max-age-ms-vitest-2026-09-12.txt`): exact lock `HOUSEHOLD_RECONCILE_MAX_AGE_MS=60000` (pure const)
- Row 4 / row 6 household reconcile max-age seam → advances automated membership freshness vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## USER_RECONCILE_MAX_AGE_MS Relates (2026-09-12, no device)

- Added `packages/api/src/lib/membership/user-reconcile-max-age-ms.test.ts` — **1/1 new PASS** / suite **1/1** (`user-reconcile-max-age-ms-vitest-2026-09-12.txt`): exact lock `USER_RECONCILE_MAX_AGE_MS=60000` (pure const)
- Row 4 / row 6 user reconcile max-age seam → advances automated membership freshness vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## WIDGET_HANDOFF_TTL_MS Relates (2026-09-12, no device)

- Added `packages/api/src/lib/households/widget-handoff-ttl-ms.test.ts` — **1/1 new PASS** / suite **1/1** (`widget-handoff-ttl-ms-vitest-2026-09-12.txt`): exact lock `WIDGET_HANDOFF_TTL_MS=120000` (pure const)
- Row 4 / row 6 widget handoff TTL seam → advances automated widget-handoff vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## POWERSYNC_JWT_ALGORITHM Relates (2026-09-12, no device)

- Added `packages/api/src/lib/powersync/powersync-jwt-algorithm.test.ts` — **1/1 new PASS** / suite **1/1** (`powersync-jwt-algorithm-vitest-2026-09-12.txt`): exact lock `POWERSYNC_JWT_ALGORITHM="ES256"` (pure const)
- Row 4 / row 6 PowerSync JWT algorithm seam → advances automated sync-token vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## KILL_SWITCH_FLAG Relates (2026-09-12, no device)

- Added `packages/api/src/lib/observability/kill-switch-flag.test.ts` — **1/1 new PASS** / suite **1/1** (`kill-switch-flag-vitest-2026-09-12.txt`): exact lock `KILL_SWITCH_FLAG="KILL_SWITCH_LOCAL_ONLY"` (pure const)
- Row 4 / row 6 kill-switch flag seam → advances automated observability vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## LAST_ADMIN_MESSAGE Relates (2026-09-12, no device)

- Added `packages/api/src/lib/households/last-admin-message.test.ts` — **1/1 new PASS** / suite **1/1** (`last-admin-message-vitest-2026-09-12.txt`): exact lock of `LAST_ADMIN_MESSAGE` copy (pure string const)
- Row 4 / row 6 last-admin guard copy seam → advances automated household-admin vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## HOUSEHOLD_ROLES Relates (2026-09-12, no device)

- Added `packages/protocol/src/household-roles.test.ts` — **1/1 new PASS** / suite **1/1** (`household-roles-node-test-2026-09-12.txt`): exact lock of `HOUSEHOLD_ROLES` admin/member/viewer vocabulary (pure frozen table)
- Row 4 / row 6 household-role vocabulary seam → advances automated authorization role lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## NO_SYNC_ENROLLMENT Relates (2026-09-12, no device)

- Added `apps/mobile/modules/access/no-sync-enrollment.test.ts` — **1/1 new PASS** / suite **1/1** (`no-sync-enrollment-jest-2026-09-12.txt`): exact lock of `NO_SYNC_ENROLLMENT` empty sentinel (pure frozen table)
- Row 4 / row 6 access no-sync-enrollment seam → advances automated enrollment vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## POWERSYNC_DISCONNECT_THRESHOLD_MS Relates (2026-09-12, no device)

- Added `apps/mobile/modules/powersync/powersync-disconnect-threshold-ms.test.ts` — **1/1 new PASS** / suite **1/1** (`powersync-disconnect-threshold-ms-jest-2026-09-12.txt`): exact lock `POWERSYNC_DISCONNECT_THRESHOLD_MS=600000` (pure const)
- Row 4 / row 6 PowerSync disconnect-threshold seam → advances automated availability vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## DATABASE_RESET_VERSION Relates (2026-09-12, no device)

- Added `apps/mobile/db/database-reset-version.test.ts` — **1/1 new PASS** / suite **1/1** (`database-reset-version-jest-2026-09-12.txt`): exact lock `DATABASE_RESET_VERSION=1` (pure const)
- Row 4 / row 6 database reset-version seam → advances automated reset vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## PROFILE_HOUSEHOLD_HREF Relates (2026-09-12, no device)

- Added `apps/mobile/modules/access/profile-household-href.test.ts` — **1/1 new PASS** / suite **1/1** (`profile-household-href-jest-2026-09-12.txt`): exact lock of `PROFILE_HOUSEHOLD_HREF` settings path (pure const)
- Row 4 / row 6 profile household href seam → advances automated deep-link vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## GUIDED_SETUP_DRAFT_ID Relates (2026-09-12, no device)

- Added `apps/mobile/modules/budgeting/guided-setup-draft-id.test.ts` — **1/1 new PASS** / suite **1/1** (`guided-setup-draft-id-jest-2026-09-12.txt`): exact lock `GUIDED_SETUP_DRAFT_ID="guided-envelope-setup"` (pure const)
- Row 4 / row 6 guided-setup draft-id seam → advances automated setup-draft vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ENABLE_SYNC_MISMATCH_DESCRIPTION Relates (2026-09-12, no device)

- Added `apps/mobile/components/household/enable-sync-mismatch-description.test.ts` — **1/1 new PASS** / suite **1/1** (`enable-sync-mismatch-description-jest-2026-09-12.txt`): exact lock of `ENABLE_SYNC_MISMATCH_DESCRIPTION` copy (pure string const)
- Row 4 / row 6 enable-sync mismatch-copy seam → advances automated sync-copy vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ENABLE_SYNC_MATCHED_DESCRIPTION Relates (2026-09-12, no device)

- Added `apps/mobile/components/household/enable-sync-matched-description.test.ts` — **1/1 new PASS** / suite **1/1** (`enable-sync-matched-description-jest-2026-09-12.txt`): exact lock of `ENABLE_SYNC_MATCHED_DESCRIPTION` copy (pure string const)
- Row 4 / row 6 enable-sync matched-copy seam → advances automated sync-copy vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ENABLE_SYNC_IDLE_DESCRIPTION Relates (2026-09-12, no device)

- Added `apps/mobile/components/household/enable-sync-idle-description.test.ts` — **1/1 new PASS** / suite **1/1** (`enable-sync-idle-description-jest-2026-09-12.txt`): exact lock of `ENABLE_SYNC_IDLE_DESCRIPTION` copy (pure string const)
- Row 4 / row 6 enable-sync idle-copy seam → advances automated sync-copy vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ENABLE_SYNC_STATUS_LABEL Relates (2026-09-12, no device)

- Added `apps/mobile/components/household/enable-sync-status-label.test.ts` — **1/1 new PASS** / suite **1/1** (`enable-sync-status-label-jest-2026-09-12.txt`): exact lock of `ENABLE_SYNC_STATUS_LABEL` idle→error vocabulary (pure frozen table)
- Row 4 / row 6 enable-sync status-label seam → advances automated sync-status vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## WELCOME_GARDEN_STAGE Relates (2026-09-12, no device)

- Added `apps/mobile/components/onboarding/welcome-garden-stage.test.ts` — **1/1 new PASS** / suite **1/1** (`welcome-garden-stage-jest-2026-09-12.txt`): exact lock `WELCOME_GARDEN_STAGE=2` (pure const surface)
- Row 4 / row 6 onboarding welcome-garden seam → advances automated garden progress vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## FORM_STEPS Relates (2026-09-12, no device)

- Added `apps/mobile/components/onboarding/form-steps.test.ts` — **1/1 new PASS** / suite **1/1** (`form-steps-jest-2026-09-12.txt`): exact lock of `FORM_STEPS` name/balance/style vocabulary (pure frozen table)
- Row 4 / row 6 onboarding form-step seam → advances automated onboarding vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## REPEAT_PRESETS Relates (2026-09-12, no device)

- Added `apps/mobile/components/transaction/recurrence/repeat-presets.test.ts` — **1/1 new PASS** / suite **1/1** (`repeat-presets-jest-2026-09-12.txt`): exact lock of `REPEAT_PRESETS` daily→yearly vocabulary (pure frozen table)
- Row 4 / row 6 recurrence preset seam → advances automated recurrence vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## DEFAULT_CATEGORY_ICON Relates (2026-09-12, no device)

- Added `apps/mobile/components/category/category-form-options.test.ts` — **1/1 new PASS** / suite **1/1** (`default-category-icon-jest-2026-09-12.txt`): exact lock `DEFAULT_CATEGORY_ICON="🏷️"` (pure const surface).
- Row 4 / row 6 category default-icon seam → advances automated category chrome vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## SUCCESS_TOAST_MS Relates (2026-09-12, no device)

- Added `apps/mobile/components/banner/banner-channel.test.ts` — **1/1 new PASS** / suite **1/1** (`success-toast-ms-jest-2026-09-12.txt`): exact lock `SUCCESS_TOAST_MS=5000` (pure const surface).
- Row 4 / row 6 success-toast duration seam → advances automated toast TTL lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_PLACEHOLDER_COLOR Relates (2026-09-12, no device)

- Extended `apps/mobile/components/auth/ui/tokens.test.ts` — **1/1 new PASS** / suite **5/5** (`auth-placeholder-color-jest-2026-09-12.txt`): exact lock `AUTH_PLACEHOLDER_COLOR="#9a9896"` (pure const surface).
- Row 4 / row 6 auth placeholder-color seam → advances automated sealed-chrome input chrome lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_SHELL_SPEC Relates (2026-09-12, no device)

- Extended `apps/mobile/components/auth/ui/roles.test.ts` — **1/1 new PASS** / suite **4/4** (`auth-shell-spec-jest-2026-09-12.txt`): exact lock `AUTH_SHELL_SPEC={ headerSpacing: 8, bodySpacing: 12, bodyTopPadding: 32 }` (pure const surface).
- Row 4 / row 6 auth shell-spacing seam → advances automated sealed-chrome layout lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## localDateInTimeZone Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/recurring-rules/clock.test.ts` — **2/2 new PASS** / suite **3/3** (`local-date-in-time-zone-jest-2026-09-12.txt`): pure `localDateInTimeZone` fixed Date + IANA tz → `YYYY-MM-DD` across UTC day boundaries and US Pacific lag. Did **not** tip impure `createSystemClock` / `getSystemTimeZone`.
- Row 4 / row 6 recurring Rule-local date seam → advances automated timezone calendar mapping lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## SYSTEM_SETTLEMENT_ACTOR_ID Relates (2026-09-12, no device)

- Added `packages/api/src/lib/recurring/system-settlement-actor.test.ts` — **1/1 new PASS** / suite **1/1** (`system-settlement-actor-jest-2026-09-12.txt`): exact value lock `SYSTEM_SETTLEMENT_ACTOR_ID="user-system-settlement"` (pure const surface).
- Row 4 / row 6 recurring settlement-actor seam → advances automated system-actor identity lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## INVITATION_EXPIRES_IN_DAYS Relates (2026-09-12, no device)

- Added `packages/api/src/lib/households/invitation-expires.test.ts` — **1/1 new PASS** / suite **1/1** (`invitation-expires-jest-2026-09-12.txt`): exact value lock `INVITATION_EXPIRES_IN_DAYS=7` (pure const surface).
- Row 4 / row 6 household invitation-expiry seam → advances automated invite TTL lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## DEFAULT_ACTIVITY_LIMIT / MAX_ACTIVITY_LIMIT Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/activity/list.test.ts` — **1/1 new PASS** / suite **10/10** (`activity-limits-jest-2026-09-12.txt`): exact value locks `DEFAULT_ACTIVITY_LIMIT=50` and `MAX_ACTIVITY_LIMIT=200`; max stays above default (pure const surface). Existing cap behavior left as-is.
- Row 4 / row 6 activity page-size seam → advances automated activity-limit vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## MAX_IMPORT_CHUNK_ROWS / MAX_IMPORT_APPLY_ROWS Relates (2026-09-12, no device)

- Extended `packages/protocol/src/import.test.ts` — **1/1 new PASS** / suite **6/6** (`max-import-rows-jest-2026-09-12.txt`): exact value locks `MAX_IMPORT_CHUNK_ROWS=5` and `MAX_IMPORT_APPLY_ROWS=25`; apply limit stays above chunk size (pure const surface).
- Row 4 / row 6 import batch-size seam → advances automated migration upload limit lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## WIDGET_SAFEGUARD_FINDINGS Relates (2026-09-12, no device)

- Added `packages/auth/src/widget-contract.test.ts` — **2/2 new PASS** / suite **2/2** (`widget-safeguard-findings-jest-2026-09-12.txt`): exact 4-string membership for `WIDGET_SAFEGUARD_FINDINGS`; uniqueness/length lock (pure const surface).
- Row 4 / row 6 widget-safeguard vocabulary seam → advances automated admin-widget invariant documentation lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_FIELD_KINDS Relates (2026-09-12, no device)

- Extended `apps/mobile/components/auth/ui/roles.test.ts` — **2/2 new PASS** / suite **3/3** (`auth-field-kinds-jest-2026-09-12.txt`): exact email/name/password preset map for `AUTH_FIELD_KINDS`; key set excludes other kinds (pure const surface).
- Row 4 / row 6 auth field-kind seam → advances automated auth input-preset lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## EFFECT_TAGS Relates (2026-09-12, no device)

- Extended `packages/protocol/src/effects.test.ts` — **2/2 new PASS** / suite **5/5** (`effect-tags-jest-2026-09-12.txt`): exact 9-tag membership for `EFFECT_TAGS`; uniqueness + excludes unknown tags. `coversEffects` left as-is (already COVERED).
- Row 4 / row 6 effect-tag vocabulary seam → advances automated cache-invalidation tag lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## PERSONAL_LEDGER_PREFIX Relates (2026-09-12, no device)

- Extended `packages/protocol/src/ledger-scope.test.ts` — **2/2 new PASS** / suite **7/7** (`personal-ledger-prefix-jest-2026-09-12.txt`): exact value `"personal:"` for `PERSONAL_LEDGER_PREFIX`; `personalLedgerId` joins the prefix (pure const + helper). Existing coverage already locks `parseLedgerId` / `isPersonalLedgerId` / `sameLedgerScope`.
- Row 4 / row 6 ledger-scope prefix seam → advances automated personal-ledger id vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## COMMAND_KINDS Relates (2026-09-12, no device)

- Extended `packages/protocol/src/command.test.ts` — **2/2 new PASS** / suite **6/6** (`command-kinds-jest-2026-09-12.txt`): exact stable-order membership for `COMMAND_KINDS`; excludes retired `member.role.change`; `isCommandKind` accept/reject already covered (pure const + guard).
- Row 4 / row 6 command wire-kind seam → advances automated command vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## HOUSEHOLD_WEBHOOK_EVENTS Relates (2026-09-12, no device)

- Extended `packages/auth/src/household-events.test.ts` — **2/2 new PASS** / suite **5/5** (`household-webhook-events-jest-2026-09-12.txt`): exact membership list for `HOUSEHOLD_WEBHOOK_EVENTS`; excludes unrelated WorkOS kinds (pure const surface).
- Row 4 / row 6 household webhook event-kind seam → advances automated webhook vocabulary lock; live webhook still **BLOCKED** (**503**); live create/device still **BLOCKED** (#258).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## WIDGET_PAGE_PATH / WIDGET_SESSION_PATH Relates (2026-09-12, no device)

- Extended `packages/auth/src/member-widget-page.test.ts` — **2/2 new PASS** / suite **5/5** (`widget-page-paths-jest-2026-09-12.txt`): exact values for `WIDGET_PAGE_PATH` (`/widgets/members`) and `WIDGET_SESSION_PATH` (`/widgets/session`); also locked cheap `WIDGET_RETURN_LINK` (`trove://widget-return`) (pure const surface).
- Row 4 / row 6 member-widget path seam → advances automated widget route lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## HOUSEHOLDS_KEY Relates (2026-09-12, no device)

- Added `apps/mobile/modules/access/households-key.test.ts` — **2/2 new PASS** / suite **2/2** (`households-key-jest-2026-09-12.txt`): exact query-key tuple for `HOUSEHOLDS_KEY`; excludes other access resource keys (pure const surface).
- Row 4 / row 6 access households-query-key seam → advances automated cache-key lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## IMPORT_ENTITY_TYPES Relates (2026-09-12, no device)

- Extended `packages/protocol/src/import.test.ts` — **2/2 new PASS** / suite **5/5** (`import-entity-types-jest-2026-09-12.txt`): exact chunk-order membership for `IMPORT_ENTITY_TYPES`; vocabulary set excludes unknown kinds (pure const surface).
- Row 4 / row 6 import-bundle entity-kind seam → advances automated migration entity vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## LOCAL_ONLY_RESULT Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/observability/kill-switch.test.ts` — **2/2 new PASS** / suite **4/4** (`local-only-result-jest-2026-09-12.txt`): typed local_only shape for `LOCAL_ONLY_RESULT`; reason aligns with kill-switch vocabulary (pure const).
- Row 4 / row 6 kill-switch local-only response seam → advances automated mutation deny payload lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## EFFECT_EMOJIS Relates (2026-09-12, no device)

- Extended `apps/mobile/utils/activity.test.ts` — **2/2 new PASS** / suite **14/14** (`effect-emojis-jest-2026-09-12.txt`): exact tag→emoji membership for `EFFECT_EMOJIS`; alignment with effectEmoji (pure const surface).
- Row 4 / row 6 activity-effect emoji seam → advances automated effect-tag vocabulary lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AUTH_SHEET_CLOSED Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/access/auth-sheet-session.test.ts` — **2/2 new PASS** / suite **8/8** (`auth-sheet-closed-jest-2026-09-12.txt`): closed sentinel shape for `AUTH_SHEET_CLOSED`; distinct from open sessions (pure const surface).
- Row 4 / row 6 auth-sheet session seam → advances automated closed-sentinel lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## REJECTION_KINDS Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/powersync/rejection.test.ts` — **2/2 new PASS** / suite **7/7** (`rejection-kinds-jest-2026-09-12.txt`): exact membership list for `REJECTION_KINDS`; excludes `applied` (pure const surface).
- Row 4 / row 6 Rejected Changes kind vocabulary seam → advances automated rejection-kind lock; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## commandMetadataFor Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/powersync/command-metadata.test.ts` — **3/3 new PASS** / suite **20/20** (`command-metadata-for-jest-2026-09-12.txt`): storageVersion/commandId wrap; personal/org scope preserve; JSON commandId alignment for `commandMetadataFor` (pure factory, no PowerSync DB).
- Row 4 / row 6 PowerSync command-metadata seam → advances automated envelope packaging; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## assertLocalLedgerAuthority Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-data-source/contract.test.ts` — **3/3 new PASS** / suite **6/6** (`assert-local-ledger-authority-jest-2026-09-12.txt`): local/offline no-op; synced throws via unsupportedSyncedOperation for `assertLocalLedgerAuthority` (pure selection gate).
- Row 4 / row 6 local-authority gate seam → advances automated synced deny path; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## unsupportedSyncedOperation Relates (2026-09-12, no device)

- Added `apps/mobile/modules/ledger-data-source/contract.test.ts` — **3/3 new PASS** / suite **3/3** (`unsupported-synced-operation-jest-2026-09-12.txt`): operation/impact/nextAction message join; template interpolation; factory returns Error without throwing for `unsupportedSyncedOperation` (pure Error factory).
- Row 4 / row 6 synced-ledger deny-path seam → advances automated unsupported-op messaging; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## mapPowerSyncTransaction Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-data-source/synced-mappers.test.ts` — **4/4 new PASS** / suite **36/36** (`map-powersync-transaction-jest-2026-09-12.txt`): snake_case→SyncedTransaction; is_recurring 0/1; transfer to_account_id; FX fields for `mapPowerSyncTransaction` (pure row mapper, no PowerSync DB).
- Row 4 / row 6 PowerSync Transaction mapper seam → advances automated SQLite-row→domain mapping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## mapPowerSyncCategory Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-data-source/synced-mappers.test.ts` — **4/4 new PASS** / suite **32/32** (`map-powersync-category-jest-2026-09-12.txt`): snake_case field copy; parent_id→parentId; lifecycle_changed_at passthrough/null for `mapPowerSyncCategory` (pure row mapper, no PowerSync DB).
- Row 4 / row 6 PowerSync Category mapper seam → advances automated SQLite-row→domain mapping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## mapPowerSyncAccount Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-data-source/synced-mappers.test.ts` — **4/4 new PASS** / suite **28/28** (`map-powersync-account-jest-2026-09-12.txt`): bank→checking / card→credit_card / cash→cash; initial_balance_minor→initialBalance; exclude_from_total 0/1 for `mapPowerSyncAccount` (pure row mapper, no PowerSync DB).
- Row 4 / row 6 PowerSync Account mapper seam → advances automated SQLite-row→domain mapping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## mapSyncedTransaction Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-data-source/synced-mappers.test.ts` — **4/4 new PASS** / suite **24/24** (`map-synced-transaction-jest-2026-09-12.txt`): amountMinor→amount; account/category joins; Unknown account fallback; toAccount transfer join; Date→ISO for `mapSyncedTransaction` (pure mapper, no PowerSync DB).
- Row 4 / row 6 synced Transaction mapper seam → advances automated wire→domain mapping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## mapSyncedCategory Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-data-source/synced-mappers.test.ts` — **4/4 new PASS** / suite **20/20** (`map-synced-category-jest-2026-09-12.txt`): field copy + parentId/type passthrough; Date→ISO; null lifecycleChangedAt for `mapSyncedCategory` (pure mapper, no PowerSync DB).
- Row 4 / row 6 synced Category mapper seam → advances automated wire→domain mapping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## mapSyncedAccount Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-data-source/synced-mappers.test.ts` — **4/4 new PASS** / suite **16/16** (`map-synced-account-jest-2026-09-12.txt`): bank→checking / card→credit_card / cash→cash; initialBalanceMinor→initialBalance; Date→ISO for `mapSyncedAccount` (pure mapper, no PowerSync DB).
- Row 4 / row 6 synced Account mapper seam → advances automated wire→domain mapping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## assertSupportedTransactionUpdate Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-data-source/synced-mappers.test.ts` — **4/4 new PASS** / suite **12/12** (`assert-supported-transaction-update-jest-2026-09-12.txt`): allowlist type/amount/date/account/category/description; reject currency/FX/recurring lineage for `assertSupportedTransactionUpdate` (pure guard, no PowerSync DB).
- Row 4 / row 6 synced Transaction update seam → advances automated allowlist checks; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## assertSupportedAccountUpdate Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-data-source/synced-mappers.test.ts` — **4/4 new PASS** / suite **8/8** (`assert-supported-account-update-jest-2026-09-12.txt`): allowlist name/color/icon/excludeFromTotal/sortOrder; reject type/currency/initialBalance for `assertSupportedAccountUpdate` (pure guard, no PowerSync DB).
- Row 4 / row 6 synced Account update seam → advances automated allowlist checks; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## calculateSyncedBalance Relates (2026-09-12, no device)

- Added `apps/mobile/modules/ledger-data-source/synced-mappers.test.ts` — **4/4 new PASS** / suite **4/4** (`calculate-synced-balance-jest-2026-09-12.txt`): income +, expense -, transfer-in via toAccountId +, unrelated ignored for `calculateSyncedBalance` (pure helper, no PowerSync DB).
- Row 4 / row 6 synced ledger balance seam → advances automated account balance from synced txs; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## unfundedCardSpendingSql Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/budget/reserve.test.ts` — **2/2 new PASS** / suite **4/4** (`unfunded-card-spending-sql-jest-2026-09-12.txt`): ledger/currency/period + ceiling params without payment-side binds; GREATEST overspend sum (no LEAST/transfer subtract) for `unfundedCardSpendingSql` (CasingCache toQuery, no DB).
- Row 4 / row 6 Unfunded Card Spending SQL seam → advances automated shortfall fragment shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## cardPaymentReserveSql Relates (2026-09-12, no device)

- Added `packages/api/src/lib/budget/reserve.test.ts` — **2/2 new PASS** / suite **2/2** (`card-payment-reserve-sql-jest-2026-09-12.txt`): ledger/currency/period + ceiling params; LEAST spend/available minus card transfers floored by GREATEST for `cardPaymentReserveSql` (CasingCache toQuery, no DB).
- Row 4 / row 6 Card Payment Reserve SQL seam → advances automated reserve fragment shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## envelopeAssignedBalanceSql Relates (2026-09-12, no device)

- Added `packages/api/src/lib/budget/envelope-balance.test.ts` — **2/2 new PASS** / suite **2/2** (`envelope-assigned-balance-sql-jest-2026-09-12.txt`): destination−source net params; COALESCE SUM filter for `envelopeAssignedBalanceSql` (CasingCache toQuery, no DB).
- Row 4 / row 6 envelope assigned-balance SQL seam → advances automated envelope net fragments; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## unassignedMoneySql Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/budget/period.test.ts` — **2/2 new PASS** / suite **10/10** (`unassigned-money-sql-jest-2026-09-12.txt`): composes fundingPoolSql − assignedThroughPeriodSql params/SQL for `unassignedMoneySql` (CasingCache toQuery, no DB).
- Row 4 / row 6 Unassigned Money SQL seam → advances automated shortfall fragment shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## assignedThroughPeriodSql Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/budget/period.test.ts` — **2/2 new PASS** / suite **8/8** (`assigned-through-period-sql-jest-2026-09-12.txt`): assignment destination−source net params; COALESCE SUM shape for `assignedThroughPeriodSql` (no DB). Also hardened `fundingPoolSql` toQuery via `CasingCache`.
- Row 4 / row 6 assigned-through-period SQL seam → advances automated assignment total fragments; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## fundingPoolSql Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/budget/period.test.ts` — **2/2 new PASS** / suite **6/6** (`funding-pool-sql-jest-2026-09-12.txt`): ledger/currency/ceiling/membership params; member-account + signed-activity SQL shape for `fundingPoolSql` (no DB).
- Row 4 / row 6 Funding Pool SQL seam → advances automated budget pool fragment shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## androidControlStyle Relates (2026-09-12, no device)

- Extended `apps/mobile/components/auth/ui/recipes.test.ts` — **2/2 new PASS** / suite **9/9** (`android-control-style-jest-2026-09-12.txt`): primary gradient-end+ring; secondary solid+disabled; tertiary paddingVertical without fill/ring for `androidControlStyle`.
- Row 4 / row 6 auth Android control chrome seam → advances automated auth button chrome; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## textStyleForRole Relates (2026-09-12, no device)

- Extended `apps/mobile/components/auth/ui/recipes.test.ts` — **2/2 new PASS** / suite **7/7** (`text-style-for-role-jest-2026-09-12.txt`): AUTH_TEXT_SPECS role map; title letterSpacing; notice-error/success colors without invented italic/align for `textStyleForRole`.
- Row 4 / row 6 auth text-role paint seam → advances automated auth copy styling; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## controlLabelStyle Relates (2026-09-12, no device)

- Extended `apps/mobile/components/auth/ui/recipes.test.ts` — **2/2 new PASS** / suite **5/5** (`control-label-style-jest-2026-09-12.txt`): AUTH_CONTROL_SPECS label map; primary white / secondary foreground / tertiary muted for `controlLabelStyle`.
- Row 4 / row 6 auth control label paint seam → advances automated auth button label styling; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## fontFace Relates (2026-09-12, no device)

- Extended `apps/mobile/components/auth/ui/tokens.test.ts` — **2/2 new PASS** / suite **4/4** (`font-face-jest-2026-09-12.txt`): ios/android/default Platform.select branches for `fontFace`.
- Row 4 / row 6 auth typography face seam → advances automated Nunito face resolution; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## getTransactionScreenInitialData Relates (2026-09-12, no device)

- Added `apps/mobile/components/transaction/transaction-screen-initial-data.test.ts` — **2/2 new PASS** / suite **2/2** (`get-transaction-screen-initial-data-jest-2026-09-12.txt`): rule→form map (null amount/account/endDate); transaction map and undefined when empty for `getTransactionScreenInitialData`.
- Row 4 / row 6 transaction screen initial-data seam → advances automated edit/create form seeding; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## recurringRuleHeaderItems Relates (2026-09-12, no device)

- Extended `apps/mobile/components/transaction/transaction-screen-header-items.test.ts` — **2/2 new PASS** / suite **6/6** (`recurring-rule-header-items-jest-2026-09-12.txt`): active pause+archive+save; archived restore without archive; paused resume for `recurringRuleHeaderItems`.
- Row 4 / row 6 recurring-rule header seam → advances automated rule lifecycle chrome shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## newTransactionHeaderItems Relates (2026-09-12, no device)

- Extended `apps/mobile/components/transaction/transaction-screen-header-items.test.ts` — **2/2 new PASS** / suite **4/4** (`new-transaction-header-items-jest-2026-09-12.txt`): one-time vs recurring toggle chrome; callback wiring for `newTransactionHeaderItems`.
- Row 4 / row 6 new-transaction header seam → advances automated create chrome shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## existingTransactionHeaderItems Relates (2026-09-12, no device)

- Added `apps/mobile/components/transaction/transaction-screen-header-items.test.ts` — **2/2 new PASS** / suite **2/2** (`existing-transaction-header-items-jest-2026-09-12.txt`): delete then save item shape; callback wiring for `existingTransactionHeaderItems`.
- Row 4 / row 6 existing-transaction header seam → advances automated edit/delete chrome shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## toRecurringRuleDraft Relates (2026-09-12, no device)

- Added `apps/mobile/components/transaction/recurrence/to-recurring-rule.test.ts` — **2/2 new PASS** / suite **2/2** (`to-recurring-rule-draft-jest-2026-09-12.txt`): maps form fields/dates; name prefers description then category then type label for `toRecurringRuleDraft`.
- Row 4 / row 6 transaction→recurring draft seam → advances automated recurring create shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## recurringChangeFailureMessage Relates (2026-09-12, no device)

- Added `apps/mobile/components/recurring/recurring-change-feedback.test.ts` — **2/2 new PASS** / suite **2/2** (`recurring-change-failure-message-jest-2026-09-12.txt`): joins invalid_intent issues; stale/needs_attention copy; missing/applied fallback for `recurringChangeFailureMessage`.
- Row 4 / row 6 Recurring Rule change-failure copy seam → advances automated recurring edit error shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## getTabIcon Relates (2026-09-12, no device)

- Extended `apps/mobile/components/navigation/glass-tab-bar/tab-icons.test.ts` — **2/2 new PASS** / suite **4/4** (`get-tab-icon-jest-2026-09-12.txt`): known routes map to Phosphor icons; unknown → undefined for `getTabIcon`.
- Row 4 / row 6 glass tab-bar icon lookup seam → advances automated navigation icon resolution; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## hasTabIcon Relates (2026-09-12, no device)

- Added `apps/mobile/components/navigation/glass-tab-bar/tab-icons.test.ts` — **2/2 new PASS** / suite **2/2** (`has-tab-icon-jest-2026-09-12.txt`): known glass-tab routes true; unknown/empty/`home` false for `hasTabIcon`.
- Row 4 / row 6 glass tab-bar icon presence seam → advances automated navigation icon gating; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## gardenStageForStep Relates (2026-09-12, no device)

- Added `apps/mobile/components/onboarding/steps.test.ts` — **2/2 new PASS** / suite **2/2** (`garden-stage-for-step-jest-2026-09-12.txt`): welcome+1 at index 0; advances one stage per form step for `gardenStageForStep`.
- Row 4 / row 6 onboarding garden progress seam → advances automated welcome/form garden-stage shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## presetKeyFor Relates (2026-09-12, no device)

- Added `apps/mobile/components/transaction/recurrence/presets.test.ts` — **2/2 new PASS** / suite **2/2** (`preset-key-for-jest-2026-09-12.txt`): maps each REPEAT_PRESETS pair; unmatched frequency/interval → `custom` for `presetKeyFor`.
- Row 4 / row 6 transaction recurrence preset-key seam → advances automated Repeats menu shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## resolveUpcomingAddAction Relates (2026-09-12, no device)

- Added `apps/mobile/components/home/upcoming-add-action.test.ts` — **2/2 new PASS** / suite **2/2** (`resolve-upcoming-add-action-jest-2026-09-12.txt`): loading gate; create-account vs new recurring href for `resolveUpcomingAddAction`.
- Row 4 / row 6 Home upcoming-add CTA seam → advances automated Home empty/loading routing; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## buildWidgetPageUrl Relates (2026-09-12, no device)

- Added `apps/mobile/utils/widget-handoff.test.ts` — **2/2 new PASS** / suite **2/2** (`build-widget-page-url-jest-2026-09-12.txt` / `resolve-upcoming-add-action-jest-2026-09-12.txt`): strips trailing slashes and encodes fragment code for `buildWidgetPageUrl`.
- Row 4 / row 6 widget members handoff URL seam → advances automated widget deep-link shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## previewUnpersistedRule Relates (2026-09-12, no device)

- Added `apps/mobile/modules/recurring-rules/settlement.test.ts` — **2/2 new PASS** / suite **2/2** (`preview-unpersisted-rule-jest-2026-09-12.txt` / `build-widget-page-url-jest-2026-09-12.txt`): pending schedule preview totals/bounds; null amount or no pending dates for `previewUnpersistedRule`.
- Row 4 / row 6 Recurring Rule unpersisted preview seam → advances automated recurring create preview shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## createReversalRequest Relates (2026-09-12, no device)

- Added `apps/mobile/modules/budgeting/assignment-persistence.test.ts` — **2/2 new PASS** / suite **2/2** (`create-reversal-request-jest-2026-09-12.txt` / `preview-unpersisted-rule-jest-2026-09-12.txt`): swaps source/destination from original Assignment; uses correction reversal id/currency/period/now for `createReversalRequest`.
- Row 4 / row 6 Assignment correction reversal-request seam → advances automated Move Money correction shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## moveSetupDraftCategory Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/budgeting/setup-draft-editing.test.ts` — **2/2 new PASS** / suite **8/8** (`move-setup-draft-category-jest-2026-09-12.txt` / `create-reversal-request-jest-2026-09-12.txt`): moves category onto target Envelope and clears it from others; missing Envelope rejects for `moveSetupDraftCategory`.
- Row 4 / row 6 Setup Draft category-move seam → advances automated Envelope setup draft shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## removeSetupDraftCategory Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/budgeting/setup-draft-editing.test.ts` — **2/2 new PASS** / suite **6/6** (`remove-setup-draft-category-jest-2026-09-12.txt`): removes category from target Envelope only; missing Envelope rejects for `removeSetupDraftCategory`.
- Row 4 / row 6 Setup Draft category-removal seam → advances automated Envelope setup draft shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## toggleSetupDraftRollover Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/budgeting/setup-draft-editing.test.ts` — **2/2 new PASS** / suite **4/4** (`toggle-setup-draft-rollover-jest-2026-09-12.txt`): flips `positiveRollover` for target Envelope only; missing Envelope rejects for `toggleSetupDraftRollover`.
- Row 4 / row 6 Setup Draft rollover toggle seam → advances automated Envelope setup draft shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## updateSetupDraftFundingAccounts Relates (2026-09-12, no device)

- Added `apps/mobile/modules/budgeting/setup-draft-editing.test.ts` — **2/2 new PASS** / suite **2/2** (`update-setup-draft-funding-accounts-jest-2026-09-12.txt`): funding ids replace for matching currency only; missing currency rejects for `updateSetupDraftFundingAccounts`.
- Row 4 / row 6 Setup Draft funding-account edit seam → advances automated Envelope setup draft shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## requireRestoredCategoryConfirmation Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/budgeting/envelope-validation.test.ts` — **2/2 new PASS** / suite **8/8** (`require-restored-category-confirmation-jest-2026-09-12.txt`): confirmed/already-mapped restored categories pass; unconfirmed restored categories reject for `requireRestoredCategoryConfirmation`.
- Row 4 / row 6 envelope restored-category confirmation guard seam → advances automated Envelope mapping validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## requireChangedCategoryIds Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/budgeting/envelope-validation.test.ts` — **2/2 new PASS** / suite **6/6** (`require-changed-category-ids-jest-2026-09-12.txt`): distinct changed ids accepted (incl. empty); duplicates/blanks rejected for `requireChangedCategoryIds`.
- Row 4 / row 6 envelope changed-category-id uniqueness guard seam → advances automated Envelope update validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## requireEnvelopeFields Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/budgeting/envelope-validation.test.ts` — **2/2 new PASS** / suite **4/4** (`require-envelope-fields-jest-2026-09-12.txt`): trimmed name/emoji/color accepted; blank fields rejected for `requireEnvelopeFields`.
- Row 4 / row 6 envelope field-presence guard seam → advances automated Envelope create validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## draftFromRule Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/recurring-rules/change-results.test.ts` — **2/2 new PASS** / suite **12/12** (`draft-from-rule-jest-2026-09-12.txt`): editable rule maps to draft; null amountMinor/accountId throws repair error for `draftFromRule`.
- Row 4 / row 6 recurring rule→draft mapper seam → advances automated Recurring Rule edit prep; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## candidateFromExisting Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/recurring-rules/change-results.test.ts` — **2/2 new PASS** / suite **10/10** (`candidate-from-existing-jest-2026-09-12.txt`): draft overlays existing while keeping identity; overrides win for `candidateFromExisting`.
- Row 4 / row 6 recurring edit-candidate merge seam → advances automated Recurring Rule edit shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## invalidLifecycle Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/recurring-rules/change-results.test.ts` — **2/2 new PASS** / suite **8/8** (`invalid-lifecycle-jest-2026-09-12.txt`): pause→active and restore→archived emit `invalid_intent` for `invalidLifecycle`.
- Row 4 / row 6 recurring invalid-lifecycle guard seam → advances automated Recurring Rule intent gating; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## staleResult Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/recurring-rules/change-results.test.ts` — **2/2 new PASS** / suite **6/6** (`stale-result-jest-2026-09-12.txt`): missing rule → missing_rule; matching revision → null; mismatch → stale_revision for `staleResult`.
- Row 4 / row 6 recurring stale-revision guard seam → advances automated Recurring Rule optimistic-concurrency shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## applyBudgetTransaction Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/budgeting/card-dependency-transactions.test.ts` — **2/2 new PASS** / suite **4/4** (`apply-budget-transaction-jest-2026-09-12.txt`): cash expense debits balance + funded Envelope availability; card expense reserves available funds and records unfunded remainder for `applyBudgetTransaction`.
- Row 4 / row 6 card-dependency budget transaction application seam → advances automated budgeting dependency evaluation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## candidateFromDraft Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/recurring-rules/change-results.test.ts` — **2/2 new PASS** / suite **4/4** (`candidate-from-draft-jest-2026-09-12.txt`): draft activates as revision 1 with eligibilityFloor=startDate; schedule fields copy and settlement timestamps clear for `candidateFromDraft`.
- Row 4 / row 6 recurring draft-activation helper seam → advances automated Recurring Rule create shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## assertSourceHasMoney Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/budgeting/assignment-validation.test.ts` — **2/2 new PASS** / suite **4/4** (`assert-source-has-money-jest-2026-09-12.txt`): affordable unassigned/Envelope sources pass; overdraw + missing Envelope reject for `assertSourceHasMoney`.
- Row 4 / row 6 Move Money source-balance guard seam → advances automated budgeting affordance validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## requireCategoryIds Relates (2026-09-12, no device)

- Added `apps/mobile/modules/budgeting/envelope-validation.test.ts` — **2/2 PASS** (`require-category-ids-jest-2026-09-12.txt`): distinct non-empty ids accepted; empty/duplicate/blank rejected for `requireCategoryIds`.
- Row 4 / row 6 envelope category-id guard seam → advances automated Envelope create/update validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## applyLedgerBalance Relates (2026-09-12, no device)

- Added `apps/mobile/modules/budgeting/card-dependency-transactions.test.ts` — **2/2 PASS** (`apply-ledger-balance-jest-2026-09-12.txt`): income credit / expense debit on source; transfer moves amountMinor source→destination for `applyLedgerBalance`.
- Row 4 / row 6 card ledger-balance helper seam → advances automated budgeting balance shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## monthFilter Relates (2026-09-12, no device)

- Added `apps/mobile/modules/ledger-db/types.test.ts` — **2/2 PASS** (`month-filter-jest-2026-09-12.txt`): 31-day month inclusive from/to; leap-year February end for `monthFilter`.
- Row 4 / row 6 ledger month-bounds helper seam → advances automated period filter shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## queryFiltersToLedger Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-db/filters.test.ts` — **2/2 new PASS** / suite **12/12** (`query-filters-to-ledger-jest-2026-09-12.txt`): month bounds + optional fields map; later of month start vs `startsOnOrAfter` for `from` in `queryFiltersToLedger`.
- Row 4 / row 6 query→ledger filter mapper seam → advances automated ledger list filter shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## applyMoveToProjection Relates (2026-09-12, no device)

- Added `apps/mobile/modules/budgeting/assignment-preview.test.ts` — **2/2 PASS** (`apply-move-to-projection-jest-2026-09-12.txt`): unassigned→Envelope debit/credit; Envelope→Envelope with explicit destination available override for `applyMoveToProjection`.
- Row 4 / row 6 Move Money projection helper seam → advances automated budgeting preview shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## summarizeTransactions Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-db/filters.test.ts` — **2/2 new PASS** / suite **10/10** (`summarize-transactions-jest-2026-09-12.txt`): income+expense → netAmount; transfers ignored for `summarizeTransactions`.
- Row 4 / row 6 ledger totals helper seam → advances automated ledger summary shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## toEditDate Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-db/filters.test.ts` — **2/2 new PASS** / suite **8/8** (`to-edit-date-jest-2026-09-12.txt`): undefined stays undefined; string passthrough + Date → `yyyy-MM-dd` for `toEditDate`.
- Row 4 / row 6 ledger edit-date normalizer seam → advances automated edit-form date shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## pageTransactions Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-db/filters.test.ts` — **2/2 new PASS** / suite **6/6** (`page-transactions-jest-2026-09-12.txt`): first page sets hasMore+nextCursor; cursor continuation clears hasMore for `pageTransactions`.
- Row 4 / row 6 ledger cursor-page helper seam → advances automated ledger list paging; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## validateMoveRequest Relates (2026-09-12, no device)

- Added `apps/mobile/modules/budgeting/assignment-validation.test.ts` — **2/2 PASS** (`validate-move-request-jest-2026-09-12.txt`): valid current-period move returns period from `now`; past period rejected unless `allowPastPeriod` for `validateMoveRequest`.
- Row 4 / row 6 Move Money request-guard seam → advances automated budgeting intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## dateRangeOf Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/ledger-db/filters.test.ts` — **2/2 new PASS** / suite **4/4** (`date-range-of-jest-2026-09-12.txt`): empty rows → null min/max; unordered rows → earliest/latest bounds for `dateRangeOf`.
- Row 4 / row 6 ledger date-bounds helper seam → advances automated ledger range shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## changeEffects Relates (2026-09-12, no device)

- Added `apps/mobile/modules/recurring-rules/change-results.test.ts` — **2/2 PASS** (`change-effects-jest-2026-09-12.txt`): generatedCount 0 → `["rules","upcoming"]`; positive count delegates to `settlementEffects` for `changeEffects`.
- Row 4 / row 6 recurring change effect-tag seam → advances automated post-change invalidation shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## applyLedgerFilters Relates (2026-09-12, no device)

- Added `apps/mobile/modules/ledger-db/filters.test.ts` — **2/2 PASS** (`apply-ledger-filters-jest-2026-09-12.txt`): account match includes `toAccountId` with type filter; date-desc sort + limit after filter for `applyLedgerFilters`.
- Row 4 / row 6 ledger filter+sort helper seam → advances automated ledger list shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## createMetricsSink Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/observability/metrics.test.ts` — **2/2 new PASS** / suite **9/9** (`create-metrics-sink-jest-2026-09-12.txt`): unbound dataset falls back to console JSON for `kill_switch_engaged`; bound Analytics Engine writes positional blobs + latency doubles for `createMetricsSink`.
- Row 4 / row 6 observability metrics sink wiring seam → advances automated AE vs Workers Logs sink selection; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## createConsoleSink Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/observability/metrics.test.ts` — **2/2 new PASS** / suite **7/7** (`create-console-sink-jest-2026-09-12.txt`): injectable log receives flat single-line JSON with `metric:true` for `kill_switch_engaged`; latency_sample fields spread into logged object for `createConsoleSink`.
- Row 4 / row 6 observability console metrics sink seam → advances automated Workers Logs metric shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## ledgerReadFields Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/ledger-read-input.test.ts` — **2/2 new PASS** / suite **5/5** (`ledger-read-fields-jest-2026-09-12.txt`): optional empty/scope/householdId accept; blank householdId + unknown scope reject for `ledgerReadFields` (distinct from refining `ledgerReadInput`).
- Row 4 / row 6 ledger read optional wire-field seam → advances automated read RPC envelope validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## recurringRuleContentRow Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/migration/import-content.test.ts` — **2/2 new PASS** / suite **14/14** (`recurring-rule-content-jest-2026-09-12.txt`): full recurring rule content map with null change timestamps; ISO serialization of lifecycle/health/settlement attempt timestamps when present.
- Row 4 / row 6 import content row codec seam → advances automated migration payload shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## assignmentContentRow Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/migration/import-content.test.ts` — **2/2 new PASS** / suite **12/12** (`assignment-content-jest-2026-09-12.txt`): assignment envelope/period/amount map; null vs present `reversesAssignmentId`.
- Row 4 / row 6 import content row codec seam → advances automated migration payload shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## fundingMembershipContentRow + rolloverSettingContentRow Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/migration/import-content.test.ts` — **2/2 new PASS** / suite **10/10** (`funding-rollover-content-jest-2026-09-12.txt`): `fundingMembershipContentRow` account funding period binding; `rolloverSettingContentRow` envelope rollover period binding.
- Row 4 / row 6 import content row codec seams → advances automated migration payload shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## envelopeContentRow + categoryMappingContentRow Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/migration/import-content.test.ts` — **2/2 new PASS** / suite **8/8** (`envelope-category-mapping-content-jest-2026-09-12.txt`): `envelopeContentRow` display/lifecycle ISO map; `categoryMappingContentRow` category→envelope effective-period binding.
- Row 4 / row 6 import content row codec seams → advances automated migration payload shaping; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## pendingDatesFrom + lifecycleAfterSettlement Relates (2026-09-12, no device)

- Added `packages/api/src/domain/pending-lifecycle-settlement.test.ts` — **4/4 PASS** (`pending-lifecycle-settlement-jest-2026-09-12.txt`): pending dates through localDate with eligibility/existing filters + endCount cap; lifecycle `completed` on endCount/endDate exhaustion else keep lifecycle for `@trove/domain/settlement`.
- Row 4 / row 6 domain settlement pending/lifecycle helper seams → advances automated recurring settlement intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## formatActivityFullTimestamp Relates (2026-09-12, no device)

- Extended `apps/mobile/utils/activity.test.ts` — **2/2 new PASS** / suite **12/12** (`format-activity-full-timestamp-jest-2026-09-12.txt`): absolute `MMM d, yyyy at h:mm a` detail stamp; year + `at` separator for `@/utils/activity` `formatActivityFullTimestamp`.
- Row 4 / row 6 mobile activity absolute timestamp helper seam → advances automated activity UI copy validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## settlementEffects Relates (2026-09-12, no device)

- Added `packages/api/src/domain/settlement-effects.test.ts` — **2/2 PASS** (`settlement-effects-jest-2026-09-12.txt`): generatedCount > 0 → full ledger effect tags; generatedCount 0 → `["rules"]` only for `@trove/domain/settlement` `settlementEffects`.
- Row 4 / row 6 domain settlement effects helper seam → advances automated recurring settlement intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## dateAfter Relates (2026-09-12, no device)

- Added `packages/api/src/domain/date-after.test.ts` — **3/3 PASS** (`date-after-jest-2026-09-12.txt`): mid-month next day; month-end rollover; year-end rollover for `@trove/domain/calendar` `dateAfter`.
- Row 4 / row 6 domain calendar day helper seam → advances automated recurring/settlement date math; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## budgetPeriodOf Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/budget-period-of.test.ts` — **3/3 PASS** (`budget-period-of-jest-2026-09-12.txt`): YYYY-MM from ledger date; year/month boundaries; already-period input slice.
- Row 4 / row 6 command budget period helper seam → advances automated budgeting intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## toWireAccountType Relates (2026-09-12, no device)

- Added `apps/mobile/lib/account-wire-type.test.ts` — **3/3 PASS** (`to-wire-account-type-jest-2026-09-12.txt`): cash→cash; credit_card→card; other product types→bank.
- Row 4 / row 6 mobile account wire mapper seam → advances automated import/sync intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## archiveCategoryPayloadSchema Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/archive-category-payload-schema.test.ts` — **2/2 PASS** (`archive-category-payload-schema-jest-2026-09-12.txt`): archive accept/reject on `categoryId`.
- Row 4 / row 6 command archive category payload wire seam → advances automated intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## createCategoryPayloadSchema + updateCategoryPayloadSchema Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/create-update-category-payload-schemas.test.ts` — **4/4 PASS** (`create-update-category-payload-schemas-jest-2026-09-12.txt`): create defaults/rejects; update accept/reject on `categoryId` / blank name.
- Row 4 / row 6 command create/update category payload wire seams → advances automated intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## editTransactionPayloadSchema + removeTransactionPayloadSchema Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/edit-remove-transaction-payload-schemas.test.ts` — **4/4 PASS** (`edit-remove-transaction-payload-schemas-jest-2026-09-12.txt`): edit accept/reject (blank id, non-positive amount, malformed date); remove accept/reject on `transactionId`.
- Row 4 / row 6 command edit/remove transaction payload wire seams → advances automated intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## updateAccountPayloadSchema + archiveAccountPayloadSchema Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/update-archive-account-payload-schemas.test.ts` — **4/4 PASS** (`update-archive-account-payload-schemas-jest-2026-09-12.txt`): update accept/reject; archive accept/reject on `accountId`.
- Row 4 / row 6 command update/archive account payload wire seams → advances automated intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## recurringChangePayloadSchema Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/recurring-change-payload-schema.test.ts` — **4/4 PASS** (`recurring-change-payload-schema-jest-2026-09-12.txt`): create + ruleId/rule accept; transfer without destination reject; pause|resume|archive|restore + expectedRevision; change_time_zone.
- Row 4 / row 6 command recurring-change payload wire seam → advances automated intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## createAccountPayloadSchema + createTransactionPayloadSchema Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/create-payload-schemas.test.ts` — **4/4 PASS** (`create-payload-schemas-jest-2026-09-12.txt`): account create defaults/rejects; transaction create defaults + positive amount / YYYY-MM-DD date gates.
- Row 4 / row 6 command create payload wire seams → advances automated intent validation; live create/device still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## preconditionSchema + commandScopeSchema Relates (2026-09-12, no device)

- Extended `packages/api/src/lib/commands/schema.test.ts` — **4/4 new PASS** / suite **13/13** (`command-scope-precondition-schema-jest-2026-09-12.txt`): `preconditionSchema` empty/partial accept + blank/negative reject; `commandScopeSchema` personal/org accept + unknown/blank org reject.
- Row 4 / row 5 command wire precondition + ledger-scope schema seams → advances automated envelope edges; live capability/device still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## newDeletionOperationId Relates (2026-09-12, no device)

- Added `packages/api/src/lib/deletion/operation-id.test.ts` — **2/2 PASS** (`new-deletion-operation-id-jest-2026-09-12.txt`): `user:`/`household:` prefix + target id + UUID; distinct ids per call.
- Row 7 deletion operation id factory seam → advances automated deletion bookkeeping; live user deletion still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## householdImportBinding Relates (2026-09-12, no device)

- Added `apps/mobile/lib/migration/import-binding.test.ts` — **2/2 PASS** (`household-import-binding-jest-2026-09-12.txt`): `householdImportBinding` sets kind/householdId/ledgerId; `personalImportBinding` uses `personal:${userId}`.
- Row 3 / row 4 / row 6 migration import ledger binding seam → advances automated household import target; live one-device import still **BLOCKED** (#258); webhook still **BLOCKED** (**503**).
- Dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## isPlanRejection Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/pipeline-guard.test.ts` — **2/2 PASS** (`is-plan-rejection-jest-2026-09-12.txt`): plans with `statements` are not rejections; forbidden/invalid_intent/missing_entity/stale_version/conflict are.
- Row 5 / row 6 command plan vs typed rejection discriminant → advances automated demotion/invalid-intent gate; live capability/device still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## bindLedgerScope Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/scope.test.ts` — **2/2 PASS** (`bind-ledger-scope-jest-2026-09-12.txt`): personal scope → `personal:${userId}` + null householdId; organization scope → ledgerId/householdId = organizationId.
- Row 3 / row 5 command ledger scope binding seam → advances automated tenancy bind; live dual-identity still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## sessionFromClaims + assertTokenBinding Relates (2026-09-12, no device)

- Added `packages/auth/src/session-from-claims.test.ts` — **6/6 PASS** (`session-from-claims-jest-2026-09-12.txt`): `sessionFromClaims` maps sub/email/name/org/sid, composes first/last name, rejects missing sub; `assertTokenBinding` accepts aud string/array, rejects wrong aud / missing aud with custom audience, binds no-aud tokens via `client_id`.
- Row 2 AuthKit claim→session + token binding seam → advances automated verify helpers; live OTP/device AuthKit still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## periodCeiling + periodLastDate Relates (2026-09-12, no device)

- Added `packages/api/src/lib/budget/period.test.ts` — **4/4 PASS** (`period-helpers-jest-2026-09-12.txt`): `periodCeiling` next-month/year-roll; `periodLastDate` inclusive month end incl. leap February and December.
- Row 3 / row 6 budget period boundary seam → advances automated period window helpers; live device budget activation still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## coversEffects Relates (2026-09-12, no device)

- Added `packages/protocol/src/effects.test.ts` — **3/3 PASS** (`covers-effects-jest-2026-09-12.txt`): empty/full subset coverage; missing-tag reject; unordered extras allowed.
- Row 4 / row 6 command+activity effect-tag coverage seam → advances automated invalidation gate; live device/activity still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## isHouseholdRole + isCommandKind Relates (2026-09-12, no device)

- Added `packages/protocol/src/command.test.ts` — **4/4 PASS** (`household-role-command-kind-jest-2026-09-12.txt`): `isHouseholdRole` accepts admin/member/viewer and rejects unknown/cased slugs; `isCommandKind` accepts registered kinds incl. `import_bundle` and rejects retired/unknown kinds.
- Row 4 WorkOS role slug + command-kind vocabulary gate → advances automated authorization seams; live invite/role UX still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## manifestsMatch + canonicalizeImportContent Relates (2026-09-12, no device)

- Added `packages/protocol/src/import.test.ts` — **3/3 PASS** (`import-manifest-canonical-jest-2026-09-12.txt`): `manifestsMatch` equal aggregates/digest; rejects row-count/amount/digest drift; `canonicalizeImportContent` stable entity/id/key order.
- Row 6 migration import integrity seam → advances automated manifest equality + content canonicalization; live import/device still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## toDirectoryMembership Vitest Relates (2026-09-12, no device)

- Added `packages/auth/src/to-directory-membership.test.ts` — **2/2 PASS** (`to-directory-membership-jest-2026-09-12.txt`): maps WorkOS membership → `roleSlug` + Date timestamps; preserves unknown role slugs and pending/inactive status.
- Row 4 / row 5 directory membership projection seam → advances automated WorkOS membership normalize; live webhook apply still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Import-content row codec Vitest Relates (2026-09-12, no device)

- Added `packages/api/src/lib/migration/import-content.test.ts` — **6/6 PASS** (`import-content-jest-2026-09-12.txt`): `accountContentRow` null lifecycle ISO; `categoryContentRow` lifecycleChangedAt ISO; `transactionContentRow` money/FK preservation; `budgetWorkspaceContentRow` activation period; `recurringOccurrenceContentRow` settledAt ISO; `sha256Hex` stable hex digest.
- Row 6 migration import content serialization + digest seam → advances automated gates; live import/device still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Card-dependency + setup-draft codec Jest Relates (2026-09-12, no device)

- Added `apps/mobile/modules/budgeting/card-dependency-validation.test.ts` + `setup-draft-codec.test.ts` — **10/10 PASS** (`card-dependency-setup-draft-jest-2026-09-12.txt`): dependency fact validation, cross-currency transfer guard, guided Setup Draft decode/reject.
- Row 3 / row 6 budget activation + guided setup draft seams → advances automated gates; live device budget activation still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Sole-admin deletion + budget pure Jest Relates (2026-09-12, no device)

- Added `packages/api/src/lib/households/sole-admin-deletion-guard.test.ts` (**5/5**) and mobile `validation.test.ts`/`funding-account-eligibility.test.ts`/`account-ledger-date.test.ts` (**11/11**) (`sole-admin-budget-pure-jest-2026-09-12.txt`): sole-admin list/assert; funding eligibility; money/period validation; accountLifecyclePeriod.
- Row 7 User-deletion sole-admin prevention + budget funding pure seams → advances automated gates; live User deletion / device budget activation still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Command shared + ledger-read + PowerSync key Jest Relates (2026-09-12, no device)

- Added `packages/api/src/lib/commands/handlers/shared.test.ts`, `ledger-read-input.test.ts`, `powersync/key.test.ts` — **9/9 PASS** (`command-shared-ledger-powersync-jest-2026-09-12.txt`): `issuesFromZod`/`checkExpectedVersion`/`scopeColumns`; `ledgerReadInput` personal/org/legacy + empty reject; `importPowerSyncPrivateKey` non-PEM reject + ES256.
- Row 4 / row 6 command validation + read-scope + PowerSync key gate → advances automated seams; live PowerSync mint still **BLOCKED** ( ABSENT); webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Reconcile freshness + requireUserId Jest Relates (2026-09-12, no device)

- Added `packages/api/src/lib/membership/reconcile-freshness.test.ts`, `require-user.test.ts` — **7/7 PASS** (`reconcile-freshness-jest-2026-09-12.txt`): `isStale` null/window edges; `observationFromDirectory` maps + webhook overrides; `requireUserId` session narrow / UNAUTHORIZED.
- Row 5 / row 7 reconcile freshness + auth session seam → advances automated gates; live dual-identity and webhook apply still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Widget handoff code Jest Relates (2026-09-12, no device)

- Added `packages/api/src/lib/households/widget-handoff.test.ts` — **3/3 PASS** (`widget-handoff-jest-2026-09-12.txt`): `generateHandoffCode` distinct base64url; `hashHandoffCode` deterministic SHA-256; TTL 120s.
- Row 4 admin widget browser-handoff seam → advances automated code/hash; live widget mint/device return still **BLOCKED**; webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## WorkOS verify-env Jest Relates (2026-09-12, no device)

- Added `packages/auth/src/workos-env.test.ts` — **4/4 PASS** (`workos-verify-env-jest-2026-09-12.txt`): `resolveWorkOSVerifyEnv` defaults audience=clientId / issuer=api.workos.com; honors overrides; rejects blank client/api key; empty audience override falls back to client id.
- Row 2 AuthKit token-verify env seam → advances automated verify-env resolution; live OTP/device AuthKit still **BLOCKED** (AX); webhook still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Server capability + tenancy Jest Relates (2026-09-12, no device)

- Added `packages/api/src/lib/households/admin-guard.test.ts`, `commands/capabilities.test.ts`, `require-member.test.ts` — **17/17 PASS** (`server-capability-tenancy-jest-2026-09-12.txt`): `canDropAdmin` sole-admin guard; `can`/`requiredCapability` admin/member/viewer matrix incl. `import_bundle` admin-only; `resolveReadLedgerId` + personal/org `requireLedgerAccess` / `requireHouseholdMember` tenancy.
- Row 4 / row 5 server role + isolation seams → advances automated capability/tenancy; live invite/device role UX and dual-identity still **BLOCKED**; webhook membership apply still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing); Android / OTP AX / PowerSync mint unchanged **BLOCKED**. Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## AccessCore projection + capabilities Jest Relates (2026-09-12, no device)

- Added `apps/mobile/modules/access/core-from-state.test.ts`, `capabilities.test.ts`, `route-param.test.ts` — **11/11 PASS** (`access-core-capabilities-jest-2026-09-12.txt`): `coreFromAccess` strips capability bags / unavailable `retry`; `attachCapabilities` reattaches beginAuth/signOut/setActiveHousehold + household retry; `firstRouteParam` normalizes Expo Router string|string[].
- Row 5 / row 7 AccessCore ↔ AccessState seam → advances automated projection + capability attach; live device identity switch / dual-identity still **BLOCKED**; webhook membership apply still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing); Android / OTP AX / PowerSync mint unchanged **BLOCKED**. Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Memberships role summary Jest Relates (2026-09-12, no device)

- Added `apps/mobile/modules/access/memberships.test.ts` — **4/4 PASS** (`memberships-role-jest-2026-09-12.txt`): `toMembershipSummary` maps admin/member/viewer + Date→ISO / string joinedAt; unknown role slug → `null`; `roleLabel` Admin/Member/Viewer literals.
- Row 4 Admin / member / viewer **client** role boundary (listMine → typed membership, refuse unknown roles) → advances automated seam; live invite acceptance / device role UX still **not** run; webhook membership apply still **BLOCKED** (**503**).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing); Android / OTP AX / PowerSync mint unchanged **BLOCKED**. Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Ledger-source remaining-BLOCKED reaffirm (2026-09-12, docs-only)

- Gap check: `selectLedgerSourceForAccess` `local_only` + `kill_switch` / `powersync_unavailable` offlineReason paths **already covered** at product `0e09809` (tip chain through `d6e4340`).
- Re-verify this write (no new tests): `pnpm exec jest modules/access/access.test.ts --runInBand` → **35/35 PASS**; `tsc --noEmit` exit **0**. Evidence still `ledger-source-offline-jest-2026-09-12.txt`.
- Remaining **BLOCKED** (unchanged; no CI PASS claimed): WorkOS webhook **503** (`WORKOS_WEBHOOK_SECRET`); Create Account one-device on [#258](https://github.com/Stringsaeed/money-management/pull/258); live dual-identity (`CERT_USER_A_TOKEN` / `CERT_USER_B_TOKEN` ABSENT); GH Actions billing/spend limit. Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Ledger-source local_only offlineReason Jest Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/access/access.test.ts` — **35/35 PASS** (`ledger-source-offline-jest-2026-09-12.txt`): prior `selectLedgerSourceForAccess` suite plus `local_only` + `kill_switch` → `offline_cached` reason `Sync is temporarily unavailable.`; `local_only` + `powersync_unavailable` → `PowerSync has been disconnected for over 10 minutes.`
- Row 6 client offlineReason mapping for kill-switch / PowerSync disconnect → advances automated seam; live PowerSync removal + offline-device measure still **BLOCKED** (`POWERSYNC_*` ABSENT).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); webhook membership apply still **BLOCKED** (**503** empty prod `WORKOS_WEBHOOK_SECRET`); dual-identity still **BLOCKED**; GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Session-probe async Jest Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/access/session-probe.test.ts` — **13/13 PASS** (`session-probe-jest-2026-09-12.txt`): prior `mapSessionSnapshot` + `isUnreachableFailure`, plus async `probeSession` (session / no_session / unreachable transport / reachable Error → no_session) and `tryRemoteSignOut` (ok / unreachable TypeError / reachable Error → ok).
- Row 7 identity-switch / sign-out remote seam → advances automated `probeSession` + best-effort remote sign-out; live device sign-out / dual-identity still **BLOCKED** (`CERT_USER_A_TOKEN`, `CERT_USER_B_TOKEN`, … ABSENT).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); webhook membership apply still **BLOCKED** (**503** empty prod `WORKOS_WEBHOOK_SECRET`); GH Actions still **BLOCKED** (billing). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## GitHub Actions billing BLOCKED (2026-09-12T06:51Z)

- Tip `59020a6` / product `8f0bc15`: Actions jobs **Typescript**, **Jest**, **Preview with EAS** fail in ~2–4s **without starting**.
- Annotation: _The job was not started because recent account payments have failed or your spending limit needs to be increased._
- Evidence: `ci-billing-blocked-2026-09-12.txt` (runs `34679141401` / `34679141409` / `34679141444`).
- **Local** on cert worktree: `tsc --noEmit` exit 0; Jest plan-membership-revocation + access + claim-store **46/46 PASS**. Do **not** treat billing-failed jobs as product regressions.
- Owner must fix org billing / raise Actions spend limit, then re-run checks on [#241](https://github.com/Stringsaeed/money-management/pull/241). Relates to #232 only. Matrix still incomplete.

## Membership-revocation / stale-selection Jest Relates (2026-09-12, no device)

- Added `apps/mobile/components/sync/plan-membership-revocation.ts` + `plan-membership-revocation.test.ts` (**5/5**); wired `membership-revocation-cleanup.tsx` through the planner; extended `access.test.ts` with `normalizeLedgerSelection` stale-id → Personal (**3** cases). Combined suite with existing access tests: **38/38 PASS** (`membership-revocation-jest-2026-09-12.txt`).
- Confirmed-removal seam: clears Household sync enrollment/PowerSync plan when enrollment is lost; clears stale Household selection; **does not** clear Personal selection or identity claim (claim clear remains on explicit sign-out / `sign-out-session.test.ts` **2/2** for `session_revoked` cleanup).
- Row 5 stale-response client cleanup → advances automated membership-revocation + selection normalize seam; live stale HTTP/sync after identity switch still **not** device-certified.
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); webhook membership apply still **BLOCKED** (**503** empty prod `WORKOS_WEBHOOK_SECRET`); dual-identity still **BLOCKED**. Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Claim-store SecureStore Jest Relates (2026-09-12, no device)

- Extended `apps/mobile/modules/access/claim-store.test.ts` — **8/8 PASS** (`claim-store-jest-2026-09-12.txt`): held round-trip, `none` clears, `clearClaim` key removal, redundant-write skip (same user + `establishedAt`), soft-fail read → `none` on SecureStore throw.
- Row 5 / row 7 identity **claim persistence** seam (SecureStore read/write/clear + no-op) → **PASS (automated)**; live device identity switch + dual-identity still **BLOCKED** (`CERT_USER_A_TOKEN`, `CERT_USER_B_TOKEN`, … ABSENT).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); webhook membership apply still **BLOCKED** (**503** empty prod `WORKOS_WEBHOOK_SECRET`). Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Isolation / identity helper Jest Relates (2026-09-12T06:33Z, no device)

- Added `apps/mobile/modules/access/ledger-selection-store.test.ts`, `return-to.test.ts`, `identity.test.ts` — **17/17 PASS** (`isolation-helpers-jest-2026-09-12.txt`).
- Live re-probe: `GET /` **200 OK**; `POST /webhooks/workos` still **503** empty `WORKOS_WEBHOOK_SECRET` (`workos-webhook-probe-2026-09-12d.txt`). Runner name **ABSENT**.
- Row 5 multi-Household selection encode/decode + per-user SecureStore key isolation → **PASS (automated seam)**; live dual-identity still **BLOCKED** (`CERT_USER_A_TOKEN`, `CERT_USER_B_TOKEN`, … ABSENT).
- Row 7 `sameIdentity` + return-to parse/serialize → **PASS (automated helpers)**; live device identity switch still **not** certified.
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258); webhook membership apply still **BLOCKED**. Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Sync-or-discard / identity-switch Jest Relates (2026-09-12, no device)

- Added `apps/mobile/hooks/use-sign-out.test.tsx` (**4/4**) and `apps/mobile/modules/access/sign-out-session.test.ts` (**2/2**).
- Row 7 sync-or-discard + identity-switch cleanup → **PASS (automated)**; live device sign-out / dual-identity still **not** certified.
- Row 5 stale-response note updated for client cleanup seam (still not live stale-HTTP certification).
- Create Account still **BLOCKED** on [#258](https://github.com/Stringsaeed/money-management/pull/258) device PASS; webhook still **503**; Mac workers offline — no ghost spawns.
- Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

## Goal-continue Relates re-probe (2026-09-12T06:03:43Z, no device / no Mac)

- Live `GET https://auth.trove.ing/` → **200** `OK`.
- Webhook re-probe still **503** empty prod `WORKOS_WEBHOOK_SECRET` (`goal-continue-reprobe-2026-09-12c.txt`). Runner also lacks that env name.
- PR [#241](https://github.com/Stringsaeed/money-management/pull/241) tip `2ac477b` product CI: Typescript + Jest + EAS **SUCCESS**; GitGuardian **FAILURE** (historical PostHog — not inventing security PASS).
- Create Account next remains [#258](https://github.com/Stringsaeed/money-management/pull/258) tip `709acf8` — draft, all product CI green — device still **BLOCKED** (money-management Mac worker offline; prior Mac retest stopped; not restarted). **Not** PASS. Do not merge #258 from this write.
- Dual-session isolation still **BLOCKED** (`CERT_USER_A_TOKEN`, `CERT_USER_B_TOKEN`, …) — names ABSENT on this runner.
- PowerSync / PlanetScale mint + disposable reset still **BLOCKED** (`POWERSYNC_*`, `PLANETSCALE_*` / `DATABASE_URL` ABSENT).
- Android runtime / iOS OTP AX unchanged **BLOCKED**.
- Cloud Relates stamp agents ghosted this hour → stopped; this stamp written in coordinator worktree. Relates to #232 only. Matrix still incomplete.

## Non-device Relates advance (2026-09-12T05:47Z, no device / no Mac)

- Schema DDL 0011–0015 **PASS** second reconfirm (`planetscale-schema-ddl-confirm-2026-09-12b.txt`).
- CI stamp **PASS** (product gates): PR #241 tip `ded1e97` GitHub Actions **Typescript** + **Jest** + **EAS Preview** SUCCESS (`ci-stamp-2026-09-12.txt`). GitGuardian **FAILURE** recorded (not inventing security-scan PASS).
- Explicit **BLOCKED** docs (env names only where applicable):
  - Android runtime — `android-runtime-blocked.md` (device required; not started)
  - AuthKit OTP AX — unchanged `ios-otp-ax-blocker.md`
  - PowerSync removal + disposable reset — `powersync-disposable-reset-blocked.md` (`POWERSYNC_*`, `PLANETSCALE_*` / `DATABASE_URL`)
- Create Account next candidate updated to [#258](https://github.com/Stringsaeed/money-management/pull/258) tip `709acf8` — still **BLOCKED** (Mac ghosting). **Not** claimed PASS. Do not merge #258 from this write.
- Webhook re-probe still **503** empty `WORKOS_WEBHOOK_SECRET` (`workos-webhook-probe-2026-09-12b.txt`).
- Dual-session isolation still **BLOCKED** (`CERT_USER_A_TOKEN`, `CERT_USER_B_TOKEN`, …).
- Evidence: this section + files above. Relates to #232 only. Matrix still incomplete.

## API-only isolation / auth-gate Relates (2026-09-12, no device)

- Live dual-identity isolation **BLOCKED** — absent dual session tokens / WorkOS mint names: `CERT_USER_A_TOKEN`, `CERT_USER_B_TOKEN` (and aliases `TEST_USER_*_BEARER`, `TROVE_TEST_TOKEN_*`, `API_BEARER_*`), plus `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_CLAIM_TOKEN`, `WORKOS_COOKIE_PASSWORD` (values never recorded).
- Auth gate **PASS**: missing bearer → **401** `missing_token`; forged JWT (+ forged `householdId` / `targetUserId` body) → **401** `invalid_token` on `listMine` / `get` / `invite` / `setMemberRole` / `rename` / `getManifest` / `powersync/token` (`live-auth-gate-probe-2026-09-12.txt`). CF window 05:20–05:35Z: **7** `missing_token` + **8** `invalid_token`.
- Viewer-write denial (API seam) **PASS**: `pipeline.test.ts` **18/18** including viewer capability map (`test-pipeline-viewer-deny.txt`) — previously not in the captured 97-test run.
- Schema DDL 0011–0015 **PASS** reconfirm via PlanetScale read-only (`planetscale-schema-ddl-confirm-2026-09-12.txt`): `accounts.ledger_id`, `membership.status`, `household.create_request_id`, `user.memberships_reconciled_at`, `ledger` table.
- Webhook still **BLOCKED** (**503** empty `WORKOS_WEBHOOK_SECRET`). Create Account still **BLOCKED** — **not** claimed PASS.
- Evidence: `api-isolation-live-2026-09-12.md`. Relates to #232 only. Matrix still incomplete.

## Create Account hit-test / one-device round-trip (2026-09-12)

- Personal upload confirm: **PASS** at cert tip [`fb8c786`](https://github.com/Stringsaeed/money-management/commit/fb8c78656551a4e756061d81a15a9d21a783ce1f) (`post-pressable-upload-pass.md`).
- Create Account / one-device round-trip: still **BLOCKED** on device after [#254](https://github.com/Stringsaeed/money-management/pull/254) / [#255](https://github.com/Stringsaeed/money-management/pull/255) / [#256](https://github.com/Stringsaeed/money-management/pull/256). **Do not claim PASS.**
- [#256](https://github.com/Stringsaeed/money-management/pull/256) Metro-confirmed **MISS** tip [`c9a3ca8`](https://github.com/Stringsaeed/money-management/commit/c9a3ca89c00b3a8059d5abb7c136b790d6a7a7ef) — cert evidence tip [`9e3f69f`](https://github.com/Stringsaeed/money-management/commit/9e3f69f63af70942d0e2990ec03b518d4814326d) (`create-account-fresh-mac-blocked.md`).
- [#257](https://github.com/Stringsaeed/money-management/pull/257) / #256 / #255 **superseded** by [#258](https://github.com/Stringsaeed/money-management/pull/258).
- Next candidate: [#258](https://github.com/Stringsaeed/money-management/pull/258) tip [`709acf85250c02c8f9746c544da67f0c49f99233`](https://github.com/Stringsaeed/money-management/commit/709acf85250c02c8f9746c544da67f0c49f99233) — Expo Router Create Account screen; Jest+tsc green; Mac device retest **BLOCKED** (self-hosted agents ghosting). Do **not** merge #258 from this cert write. Do **not** claim Create Account PASS.
- WorkOS webhook: still **BLOCKED** — owner must set `WORKOS_WEBHOOK_SECRET` (prod) + redeploy. See webhook section below.
- Evidence index: `create-account-hittest-status.md`. Relates to #232 only. Do not Closes #232/#224.

## WorkOS webhook prod probe (2026-09-12T03:16Z)

- `POST https://auth.trove.ing/webhooks/workos` → **HTTP 503** body `Webhook receiver is disabled: WORKOS_WEBHOOK_SECRET is not configured.`
- `GET /` → **200** `OK`; `GET /webhooks/workos` → **404** (POST-only). Fake signature still **503** (secret gate before verify).
- Prod binding empty — not 404/401/500/timeout. Dashboard webhook id `we_01M2945R34XC28KTEABF24F4CD` (signing secret not recorded).
- Membership webhook apply / live projection: **BLOCKED** until owner sets `WORKOS_WEBHOOK_SECRET` + redeploy.
- Evidence: `workos-webhook-blocked.md`, `workos-webhook-probe-2026-09-12.txt`. Relates to #232 only. Do not Closes #232/#224.

## Non-device API matrix Relates (2026-09-12, no iPhone)

- Cloudflare Observability re-query on `money-management-server-prod-mfhkibosfd6z5ym5` corroborates:
  - `claim_iss`: **22** failures pre-#246 window; **0** after 00:00Z Sep 12 → JWT issuer path **PASS**
  - `households/listMine`: **7** `200` responses in 01:00–01:10Z (no 500 in window) → **PASS**
  - `migration/getManifest`: `200` at 216ms and 412ms in 01:20–01:45Z → **PASS**
- Follow-up API-only write: auth-gate forged/missing JWT **PASS**; viewer `pipeline.test.ts` **18/18** **PASS**; schema DDL reconfirm **PASS**; live dual-identity isolation **BLOCKED** (missing dual session token names) — `api-isolation-live-2026-09-12.md`.
- 05:47Z non-device advance: CI stamp **PASS** (tsc/Jest/EAS); schema second reconfirm **PASS**; explicit BLOCKED docs for Android / PowerSync+reset; Create Account next → #258 still **BLOCKED**; webhook re-probe **503**.
- iOS OTP AX: durable **BLOCKER** note for owner — `ios-otp-ax-blocker.md` (not a fake PASS).
- Evidence: `api-matrix-non-device.md`, `cf-api-corroboration-2026-09-12.txt`, `api-isolation-live-2026-09-12.md`, `ci-stamp-2026-09-12.txt`. Relates to #232 only. Matrix still incomplete.

## Post-schema Sync retest (2026-09-12, schema 0011–0015)

- PlanetScale `trove/main` migrations **0011–0015** applied (ledger + `ledger_id`, `create_request_id`, `membership.status`, deletion tables; legacy session/account/verification dropped).
- Cloudflare Worker `money-management-server-prod-mfhkibosfd6z5ym5`, window **2026-09-12T01:20–01:45Z**:
  - `--> POST /rpc/migration/getManifest 200 216ms`
  - `--> POST /rpc/migration/getManifest 200 412ms`
- Device: **iPhone 17 Pro** only (**no stim**). Auth **PASS**. `listMine` remains **PASS** (post-#250).
- Sync `migration/getManifest` **PASS**: CF Worker **200** + UI → **Upload to your cloud?** (`authkit-102-postschema-upload-offer.png`, `authkit-103-postschema-final.png`). Prior `42703 accounts.ledger_id` cleared.
- Evidence: `post-schema-sync-retest.md`. Relates to #232 only. Matrix still incomplete — **not certified.** Do not Closes #232/#224.

## Post-#250 Sync retest (2026-09-12)

- Deploy Worker [34663345218](https://github.com/Stringsaeed/money-management/actions/runs/34663345218) **success** (`4171c2c`, #250).
- Auth **PASS**. `households/listMine` **PASS** HTTP **200** `{"json":[]}`. Prior `42703 membership.status` cleared for this RPC.
- Sync just for me was **FAIL** on `migration/getManifest` HTTP **500** client **`INTERNAL_SERVER_ERROR`** at that tip (`post-250-sync-retest.md`). **Superseded:** getManifest **PASS** after DDL 0011–0015 — CF Worker **200** + iPhone 17 Pro UI upload offer (`post-schema-sync-retest.md`, `authkit-102-postschema-upload-offer.png`).
- Relates to #232 only. Not certified.

## Post-#249 Sync retest (2026-09-12)

- Deploy Worker [34662626320](https://github.com/Stringsaeed/money-management/actions/runs/34662626320) **success** for `79b83d6` (#249). Ensure ALTER still **soft-fail `42501`**; `memberships_reconciled_at` **absent**.
- Auth **PASS**. `POST /rpc/households/listMine` **FAIL** HTTP **500** client **`INTERNAL_SERVER_ERROR`**. Owner CF: **`pg_code=42703`** `column membership.status does not exist` (`post-249-sync-retest.md`).
- Relates to #232 only. Not certified. Parent #224 stays open.

## Post-#248 Sync retest (2026-09-12)

- Deploy Worker [34661563595](https://github.com/Stringsaeed/money-management/actions/runs/34661563595) **success** for `0ab55ac` (#248). Ensure ALTER **soft-fail `42501`**; `memberships_reconciled_at` **still absent**.
- Auth **PASS**. `POST /rpc/households/listMine` **FAIL** HTTP **500** client code **`INTERNAL_SERVER_ERROR`** (`post-248-sync-retest.md`, `cdp-listMine-500-bodies-post248.txt`). Worker `pg_code` not CF-confirmed here; **#249** attributes remaining failure to **`23502`** on ensure-user timestamps. Idle for #249 deploy before retest.
- Relates to #232 only. Not certified. Parent #224 stays open.

## Verdict (this write)

**Incomplete / not certifiable yet** — Sync `getManifest` and Pressable personal upload are **PASS**; Create Account round-trip and WorkOS webhook remain **BLOCKED**. Live dual-identity isolation **BLOCKED** (no dual session tokens); auth-gate forged/missing JWT **PASS**; viewer pipeline **PASS**. Schema DDL **PASS** (reconfirmed). CI Jest/tsc **PASS** on tip (GitGuardian FAILURE noted).

- Automated typecheck and focused package tests on this branch **pass** (prior write + CI stamp).
- Repo-wide `pnpm lint` and `pnpm format:check` **fail** on pre-existing findings.
- Full `pnpm test:ci` **passed** previously: mobile Jest **742/742** + `@trove/db` cutover **3/3**; tip CI Jest/Typescript SUCCESS (`ci-stamp-2026-09-12.txt`).
- **Row 2 iOS AuthKit UI (partial):** cancel PASS; hosted AuthKit email page + email-code challenge PARTIAL; OTP entry hard-stopped (agent-device AX unavailable inside ASWebAuthenticationSession) — `ios-otp-ax-blocker.md`.
- **Post-login JWT verify:** **PASS** after #246 — prior `claim_iss` cleared (AuthKit `iss` accepted).
- **Post-login `households.listMine`:** **PASS** after #250 — HTTP **200** `{"json":[]}`.
- **Personal Sync / `migration/getManifest`:** **PASS** after DDL **0011–0015** — CF Worker `--> POST /rpc/migration/getManifest 200` (216ms, 412ms) in window 2026-09-12T01:20–01:45Z; iPhone 17 Pro UI → **Upload to your cloud?** (`post-schema-sync-retest.md`, `authkit-102-postschema-upload-offer.png`). Prior PG 42703 `accounts.ledger_id` cleared. Schema second reconfirm **PASS** (`planetscale-schema-ddl-confirm-2026-09-12b.txt`).
- **Personal upload confirm (Pressable):** **PASS** at tip `fb8c786` (`post-pressable-upload-pass.md`).
- **Create Account / one-device round-trip:** **BLOCKED** after #254/#255/#256 — Metro-confirmed MISS on #256 tip `c9a3ca8` (cert evidence `9e3f69f`). Next candidate #258 tip `709acf8` (Mac retest **BLOCKED** — money-management worker offline; agents ghosting). **Not** PASS. See `create-account-hittest-status.md`. Goal-continue re-probe 06:03Z unchanged.
- **Row 5 auth-gate / viewer pipeline:** missing + forged JWT → **401** **PASS**; `pipeline.test.ts` viewer deny **18/18** **PASS**; live dual-identity isolation **BLOCKED** (`api-isolation-live-2026-09-12.md`).
- **WorkOS webhook:** still **BLOCKED** — owner must set prod `WORKOS_WEBHOOK_SECRET` (re-probe 06:30Z still **503**; runner name ABSENT).
- **Isolation helpers (prior tip):** ledger-selection encode/decode/clear + return-to parse/serialize + `sameIdentity` **17/17 PASS**.
- **Claim-store persistence (prior write):** `readClaim` / `writeClaim` / `clearClaim` SecureStore seam **8/8 PASS** — advances row 5/7 identity claim automated seams only; live dual-identity still **BLOCKED**.
- **Session-probe async (prior write):** `probeSession` / `tryRemoteSignOut` **13/13 PASS** — advances row 7 remote session/sign-out seam only; live dual-identity still **BLOCKED**.
- **Memberships role summary (this write):** `toMembershipSummary` / `roleLabel` **4/4 PASS** — advances row 4 client role boundary only; live invite / device role UX still **not** run.
- **Android runtime:** **BLOCKED** / not started (`android-runtime-blocked.md`).
- **PowerSync removal / disposable reset:** **BLOCKED** — missing `POWERSYNC_*` / `PLANETSCALE_*` (or `DATABASE_URL`); #231 reset skipped (`powersync-disposable-reset-blocked.md`).
- OTP/callback/two-device rows still open.

Do not merge as certified. No production deploy. Parent #224 stays open. **Do not use Closes #232.**

## AuthKit live snapshot (2026-09-11T20:46Z)

- Metro `8083` **200**; iOS stim-mobile launched via `simctl` (no `stim ios` rebuild).
- Cancel abandoned sign-in: **PASS** (`authkit-03-sheet-open.png` → `authkit-04-cancel.png`).
- Continue → system alert → AuthKit staging email page → code challenge: **PARTIAL** (`authkit-06`…`authkit-09-code-challenge.png`). OTP boxes not enterable via agent-device (AX empty / fill selects page text).
- Callback / signed-in session / protected oRPC: **not evidenced** on the OTP path (AX hard-stop). Client-id mismatch **cleared** (now EQUAL). Post-login protected oRPC **not retested** on the finish pass (sim signed out).
- #242 live on `auth.trove.ing` (`44fde92`).

## Rebase onto main + #242 (2026-09-11T20:45Z)

- Rebased `cursor/workos-certify-migration-b3d1` onto `origin/main` @ `44fde92` (merge of [#242](https://github.com/Stringsaeed/money-management/pull/242)).
- Live API `https://auth.trove.ing` already has #242 (Deploy Worker succeeded for `44fde92`).
- Mac AuthKit evidence landed: cancel PASS; email/code challenge PARTIAL; OTP hard-stopped (AX unavailable).
- Client ids **EQUAL** (`client-id-compare.txt`). Post-login protected API **not retested** this finish pass (signed-out sim); #242 live on `auth.trove.ing`.
- Parent #224 stays open. **Relates to #232** only — do not close #232. Do not merge as certified. No production deploy.

### Client-id equality (Mac evidence)

| Sub-criterion                                          | Status | Evidence                                                                                                                |
| ------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Mobile public client id matches API `WORKOS_CLIENT_ID` | `PASS` | Names only: `WORKOS_CLIENT_ID` == `EXPO_PUBLIC_WORKOS_CLIENT_ID` (**EQUAL**; values omitted) (`client-id-compare.txt`). |

## Matrix honesty pass (2026-09-11T21:08Z)

- Cleared contradictory wording: client-id mismatch is **EQUAL/PASS**; post-login is **NOT RETESTED** (signed-out finish pass), not blocked by client_id.
- Recorded `WORKOS_WEBHOOK_SECRET` **present** locally; live webhook apply still not evidenced.
- PowerSync/PlanetScale mint env names remain absent (BLOCKED for rows 6/8 live mint/reset).
- Relates to #232 only. Parent #224 stays open. Do not merge as certified.

## AuthKit Mac finish pass (2026-09-11T21:05Z)

- `client_id_compare=EQUAL` (`client-id-compare.txt`).
- `WORKOS_WEBHOOK_SECRET_present=true` (value omitted). PowerSync/PlanetScale mint env names still absent.
- #242 live on `https://auth.trove.ing`.
- Cancel PASS; email/code challenge PARTIAL (OTP AX hard-stop).
- Earlier same session: signed-in Profile UI observed (`authkit-30`/`authkit-31` era). Finish pass found signed-out Sign-in sheet (`authkit-41`/`authkit-43`/`authkit-46`) — **no fresh protected `/rpc` HTTP status**.
- Do not merge as certified. Relates to #232 only. Parent #224 stays open.

## Status legend

| Status        | Meaning                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `PASS`        | Required evidence exists and the case succeeded.                                                  |
| `FAIL`        | Required check ran and failed. Call out pre-existing vs regression.                               |
| `PARTIAL`     | Some sub-criteria have evidence; others are missing, blocked, or not in the captured suite.       |
| `BLOCKED`     | Cannot run a required case. Missing env **names** listed; no values.                              |
| `SKIPPED`     | Intentionally not run, or predecessor skipped the work.                                           |
| `IN PROGRESS` | Harness started. **Do not treat as pass.** Parent fills the Runtime section when artifacts exist. |

A row is complete only when every required sub-criterion is `PASS` (or an explicitly accepted skip with evidence). `PARTIAL` / `BLOCKED` / `IN PROGRESS` / `SKIPPED` are **not** completion.

---

## Matrix

### 1. Type / lint / format / CI on the integrated revision

| Sub-criterion                  | Status                | Evidence                                                                                                                                                                                                              |
| ------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsc --noEmit` `apps/mobile`   | `PASS`                | GitHub Actions **Typescript check** SUCCESS on tip `ded1e97` (`ci-stamp-2026-09-12.txt`, run 34675791245). Prior local exit 0 also reported.                                                                          |
| `tsc --noEmit` `packages/api`  | `PASS`                | Covered by same CI Typescript job + prior local exit 0.                                                                                                                                                               |
| `tsc --noEmit` `packages/auth` | `PASS`                | Same.                                                                                                                                                                                                                 |
| `tsc --noEmit` `packages/db`   | `PASS`                | Same.                                                                                                                                                                                                                 |
| `pnpm lint` / `pnpm lint:fix`  | `FAIL` (pre-existing) | `lint.txt`, `lint-fix.txt`. **794** `error` lines (anti-slop / complexity). Not a #232 regression: product code unchanged on this branch.                                                                             |
| `pnpm format:check`            | `FAIL` (pre-existing) | `format-check.txt`. 8 files: `apps/mobile/components/ui/input.tsx`, five `artifacts/powersync-planetscale*` paths, `internal/228-wip-gap-checklist.md`. Not a #232 regression.                                        |
| Full `pnpm test:ci` / CI Jest  | `PASS`                | Prior `test-ci.txt` (Jest **742** + cutover **3**). Tip `ded1e97` GitHub Actions **Jest** SUCCESS (`ci-stamp-2026-09-12.txt`, run 34675791249). EAS Preview SUCCESS. GitGuardian FAILURE recorded (not product FAIL). |

**Row status: `PARTIAL`.** Typecheck + Jest CI pass on tip; lint/format fail pre-existing (not #232 regressions). GitGuardian failure noted separately.

### 2. Email-code sign-in, cancel, callback validation, restart, refresh rotation, session expiry, transient network recovery — iOS and Android

| Sub-criterion                                             | Status                         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access-token verify (issuer / audience / expiry / bearer) | `PARTIAL` (automated only)     | `@trove/auth` vitest **14/14** in `test-auth.txt`. Does **not** prove hosted AuthKit PKCE return on device. #242 (`44fde92`) is live on `auth.trove.ing` (aud/`client_id` fix).                                                                                                                                                                                                                                       |
| Email-code sign-in (live iOS)                             | `PARTIAL` / hard-stopped       | Reached WorkOS AuthKit staging email page + **Check your email** / 6-box challenge (`authkit-07-workos-page.png`, `authkit-08-email-filled.png`, `authkit-09-code-challenge.png`). OTP entry **BLOCKED**: agent-device reports AX-unavailable inside ASWebAuthenticationSession; `fill` selects page text instead of digit boxes. Final UI still signed out (`authkit-21-signed-out-final.png`). Android not started. |
| Cancel abandoned sign-in                                  | `PASS` (iOS)                   | Sheet open → Cancel → Settings (`authkit-03-sheet-open.png`, `authkit-04-cancel.png`).                                                                                                                                                                                                                                                                                                                                |
| Callback / state validation on return                     | not evidenced on device        | OTP not completed; no PKCE callback artifact.                                                                                                                                                                                                                                                                                                                                                                         |
| Restart survives session                                  | not evidenced                  | No signed-in session.                                                                                                                                                                                                                                                                                                                                                                                                 |
| Refresh rotation                                          | not evidenced                  | No signed-in session.                                                                                                                                                                                                                                                                                                                                                                                                 |
| Session expiry                                            | not evidenced on device        | Automated expired-token coverage in `@trove/auth` only.                                                                                                                                                                                                                                                                                                                                                               |
| Transient network recovery                                | not evidenced                  | No runtime artifact.                                                                                                                                                                                                                                                                                                                                                                                                  |
| Post-login JWT verify (issuer)                            | `PASS` (post-#246)             | #246 Deploy Worker [34659057570](https://github.com/Stringsaeed/money-management/actions/runs/34659057570) on `5899747` cleared prior `claim_iss`. Sync progresses past JWT verify.                                                                                                                                                                                                                                   |
| Post-login protected oRPC / bearer (`listMine`)           | `PASS` (post-#250)             | HTTP **200** `{"json":[]}` (`post-250-sync-retest.md`).                                                                                                                                                                                                                                                                                                                                                               |
| Post-login Sync `migration/getManifest`                   | `PASS` (post-schema 0011–0015) | CF Worker **200** (216ms / 412ms); iPhone 17 Pro UI **Upload to your cloud?** (`post-schema-sync-retest.md`, `authkit-102-postschema-upload-offer.png`). Prior ledger_id **42703** cleared.                                                                                                                                                                                                                           |
| iOS development build                                     | prior FAIL then recovered      | ExpoSQLite vendor + Metro `.rnrepo-cache` blockList on this branch; post-schema retest used **iPhone 17 Pro** (`simctl` / agent-device; **no stim**).                                                                                                                                                                                                                                                                 |
| Android development build                                 | `BLOCKED` / not started        | No Android agent-device artifacts. Explicit stamp: `android-runtime-blocked.md`. **Do not claim Android pass.**                                                                                                                                                                                                                                                                                                       |

**Row status: `PARTIAL` (cancel PASS; email challenge PARTIAL; OTP/callback hard-stopped; JWT verify PASS; `listMine` PASS; `getManifest` PASS post-DDL). Full row-2 still incomplete (OTP/Android/session rows).**

Notes: OTP automation blocked by AuthKit webview AX (not an env-name blocker) — durable owner note `ios-otp-ax-blocker.md`. Client ids **EQUAL**. JWT issuer accept **PASS** (#246). `listMine` **PASS** (post-#250; CF re-query in `cf-api-corroboration-2026-09-12.txt` / `api-matrix-non-device.md`). Still BLOCKED for live PowerSync/PlanetScale mint: `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`, `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`) — `env-hardstop-absent.txt`. `WORKOS_WEBHOOK_SECRET` **present** locally (value omitted) — live webhook apply still not evidenced.

Env present (names only) that this row can use: `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_CLAIM_TOKEN`, `WORKOS_COOKIE_PASSWORD`, `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_WORKOS_REDIRECT_URI`, `EXPO_PUBLIC_SERVER_URL`.

### 3. Anonymous use, confirmed first upload, populated cloud + separate device data, two-device personal sync without orgs

| Sub-criterion                                                            | Status                                       | Evidence                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Personal ledger without a Household                                      | `PARTIAL` (API seam)                         | `test-api-workos-seams.txt`: `personal-ledger.test.ts` **18** (creates/joins no Household; isolation; import on personal scope). `personal-budget-recurring.test.ts` **4**. `test-ledger-scope.txt` **5/5** (personal vs organization ledger ids).                                                                                                                              |
| Confirmed first upload / import manifest                                 | `PASS` (live getManifest + Pressable upload) | Live `POST /rpc/migration/getManifest` **200** after DDL 0011–0015 (`post-schema-sync-retest.md`). Pressable confirm → Uploading… → enabled at tip `fb8c786` (`post-pressable-upload-pass.md`). Automated: `import-bundle.test.ts` **15**, `manifest.test.ts` **13**; mobile hook tests **19/19**. Two-store / two-device proof still not certified.                            |
| One-device personal sync round-trip (Create Account → txn → Synced)      | `BLOCKED`                                    | Add Account **Create Account** hit-test miss after #254/#255/#256. Metro-confirmed MISS tip `c9a3ca8` (`create-account-fresh-mac-blocked.md`; cert evidence `9e3f69f`). Next candidate [#258](https://github.com/Stringsaeed/money-management/pull/258) tip `709acf8` — Mac retest **BLOCKED** (self-hosted agents ghosting). **Not** PASS. `create-account-hittest-status.md`. |
| Anonymous local-only use                                                 | not evidenced                                | Requires device. No stim/agent-device proof.                                                                                                                                                                                                                                                                                                                                    |
| Populated cloud opens separately; device ledger preserved; no auto-merge | not evidenced live                           | Same mobile/API seams are not two-store device proof.                                                                                                                                                                                                                                                                                                                           |
| Two-device personal core / budget / recurring sync, no orgs              | not evidenced                                | No second-device run. `EXPO_PUBLIC_POWERSYNC_URL` absent locally; client may obtain the endpoint from the API token response when hitting `auth.trove.ing`. That does **not** certify two-device sync.                                                                                                                                                                          |

**Row status: `PARTIAL` — personal upload PASS; Create Account round-trip `BLOCKED`; two-device not run.**

### 4. Explicit Household create, multi-Household switch, invitations, management return, admin/member/viewer, personal-data privacy

| Sub-criterion                                          | Status                                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Explicit Household create (no implicit org on sign-in) | `PARTIAL` (API seam)                          | `households/service.test.ts` **25** in `test-api-workos-seams.txt` (`createHousehold`, retries, list/get, invite, roles, last-admin, delete, widget handoff). Personal-ledger tests assert sign-in/write does not create a Household.                                                                                                                                                                                                                      |
| Multi-Household switch                                 | `PARTIAL` (encode/decode seam) / live not run | Per-user ledger selection encode/decode/clear **PASS** automated (`ledger-selection-store.test.ts`); live device selector switch still **not** evidenced.                                                                                                                                                                                                                                                                                                  |
| Invitations via WorkOS                                 | `PARTIAL` (API seam)                          | `member administration > lets only admins invite, through WorkOS invitations`. No live invite acceptance.                                                                                                                                                                                                                                                                                                                                                  |
| Management-page return (widget)                        | `PARTIAL` (API + auth)                        | Widget handoff + expired/demoted-admin codes in households tests; `@trove/auth` member-widget-page **3**. No iOS/Android return artifact.                                                                                                                                                                                                                                                                                                                  |
| Admin / member / viewer                                | `PARTIAL` (API + client role map)             | Import-bundle rejects member/viewer bulk-import; households role changes; PowerSync streams deny inactive/unknown roles (`test-powersync-proper.txt` **9/9**). Viewer command deny **PASS** in `pipeline.test.ts` **18/18** (`test-pipeline-viewer-deny.txt`). Client `toMembershipSummary` / `roleLabel` **PASS** (`memberships.test.ts` **4/4**) — unknown slugs dropped; admin/member/viewer mapped. Device role UX not run; live viewer bearer absent. |
| Personal data stays private on create/join             | `PARTIAL` (API seam)                          | Personal vs Household isolation in personal-ledger + budget-recurring + PowerSync streams. No live create/join privacy proof.                                                                                                                                                                                                                                                                                                                              |
| Webhook-driven membership apply                        | `BLOCKED` (prod)                              | Live `POST /webhooks/workos` on `auth.trove.ing` → **503** `WORKOS_WEBHOOK_SECRET is not configured.` (`workos-webhook-blocked.md`, `workos-webhook-probe-2026-09-12d.txt` 06:30Z). Runner name **ABSENT**. Local name may be present; **prod binding empty**. Not 404/401/500.                                                                                                                                                                            |

**Row status: `PARTIAL` automated / live not run / webhook apply `BLOCKED` (prod secret missing).**

### 5. Cross-User/Household API/stream isolation, cross-scope financial-ref rejection, queued writes after role downgrade, stale-response handling

| Sub-criterion                             | Status                                                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cross-User personal isolation             | `PARTIAL` (API + streams)                                              | Personal-ledger isolation (invisible, not merely forbidden); personal budget/recurring cross-user reject; PowerSync personal stream scoped by owner (`test-powersync-proper.txt`). Live dual-identity probe **BLOCKED** — absent `CERT_USER_A_TOKEN` / `CERT_USER_B_TOKEN` (and WorkOS mint names).                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Cross-Household / stream isolation        | `PARTIAL` (API + streams)                                              | Households `getHousehold` invisible to non-members; PowerSync “Personal Ledger and Household streams from bleeding”; household queries membership-guarded. Live dual-identity probe **BLOCKED** (same missing token names).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Cross-scope financial-reference rejection | `PARTIAL` (API seam)                                                   | Personal-ledger rejects addressing another User’s account / category / envelope; organization-scope rejects a non-member. Viewer capability map now **PASS** in `pipeline.test.ts` **18/18** (`test-pipeline-viewer-deny.txt`). Live viewer bearer still absent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Queued writes after role downgrade        | `PASS` (automated)                                                     | `ledger.test.ts` rechecks live membership after member→viewer demotion and forbids the drained `transaction.create`; `connector.test.ts` completes CRUD and records `forbidden` in `rejected_changes` (does not leave the batch stuck). Live multi-device demotion still not run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Stale-response handling                   | `PARTIAL` (events + client cleanup + selection/identity/claim helpers) | Membership projection stale/older/delayed observations (`test-deletion-projection.txt` **18/18**, also inside the 97). Client sign-out cleanup clears PowerSync + sync enrollment + claim/selection + query caches (`sign-out-session.test.ts` **2/2`). Membership-revocation planner **PASS** (`plan-membership-revocation.test.ts`**5/5**): enrollment-loss → sync clear plan; stale Household selection clear; Personal untouched; claim untouched.`normalizeLedgerSelection` stale id → Personal **PASS** (`access.test.ts`). Per-user selection clear + `sameIdentity` mismatch helpers **PASS** (`ledger-selection-store.test.ts`, `identity.test.ts`) — automated only; live stale HTTP/sync after identity switch still **not** device-certified. |
| Live API/stream isolation                 | `PARTIAL` (auth-gate) / dual-identity `BLOCKED`                        | Auth-gate **PASS**: missing → **401** `missing_token`; forged JWT + forged org/user body → **401** `invalid_token` (`live-auth-gate-probe-2026-09-12.txt`; CF **7**+**8**). Authenticated cross-tenant negatives **BLOCKED** without dual session tokens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**Row status: `PARTIAL`.** Isolation seams + auth-gate + viewer pipeline + automated demotion-queue PASS; live dual-identity and client stale-response after identity switch are **not** certified.

### 6. Duplicated / reordered / missed events + reconciliation; PowerSync removal / offline-device limitation

| Sub-criterion                                                             | Status                            | Evidence                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate membership events                                               | `PASS` (API seam)                 | `projectMembership ordering rule > applies the same event twice without changing anything`.                                                                                                                                                                                                                                                                     |
| Reordered / delayed / missed events + reconciliation                      | `PASS` (API seam)                 | Older-after-newer ignored; delayed newer wins; deletion tombstone vs stale created; bootstrap tombstones; `listMyHouseholds` drops a membership WorkOS no longer lists.                                                                                                                                                                                         |
| Unknown Household/User refuse                                             | `PASS` (API seam)                 | Projection refuses unknown Households/Users; households ignore unknown Organizations.                                                                                                                                                                                                                                                                           |
| PowerSync connection removal (measured bound)                             | `BLOCKED`                         | Not measured. Local worker mint blocked — absent: `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`. Explicit stamp: `powersync-disposable-reset-blocked.md`. GitHub Actions secrets **do** include `POWERSYNC_*` (names only; values not claimed). Stream **config** tests (`test-powersync-proper.txt` **9/9**) are not a live removal bound. |
| Offline-device limitation (cannot observe remote removal until reconnect) | `BLOCKED` / not measured          | No offline-device run. Same mint env hard-stop. Do not promise remote erasure while disconnected.                                                                                                                                                                                                                                                               |
| Client `local_only` / `kill_switch` → ledger `offline_cached`             | `PASS` (automated) / live not run | `selectLedgerSourceForAccess` in `access.test.ts`: `kill_switch` → `Sync is temporarily unavailable.`; `powersync_unavailable` → `PowerSync has been disconnected for over 10 minutes.` (`ledger-source-offline-jest-2026-09-12.txt`, suite **35/35**). Not a live offline-device measure.                                                                      |

**Row status: `PARTIAL` (event seams + client offlineReason) + `BLOCKED` (live PowerSync removal / offline measure).**

Note: `test-powersync.txt` is a **failed** `vitest run` (`No test suite found` / `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`). The package script is `node --test sync-streams.test.ts`. The proper run is `test-powersync-proper.txt` **9/9**. The vitest miss is a runner mismatch, not a product regression.

### 7. Sync-or-discard sign-out, identity switching, User deletion preserving shared history, last-admin guard, recoverable Household deletion

| Sub-criterion                                                                                 | Status                                                                      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User deletion anonymizes attribution, clears personal data, ignores delayed membership events | `PASS` (API seam)                                                           | `deletion/service.test.ts` in `test-api-workos-seams.txt` and `test-deletion-projection.txt`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Last-admin / sole-admin User-deletion guard                                                   | `PASS` (API seam)                                                           | `requestUserDeletion > blocks sole admins until they appoint another admin or delete the Household`; households `keeps the last admin in place`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Recoverable Household deletion                                                                | `PASS` (API seam)                                                           | Confirm-name + admin-only; shared ledger removed, personal kept, org tombstoned; resumes after WorkOS failure without duplicating local deletes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Sync-or-discard sign-out                                                                      | `PASS` (automated) / live not run                                           | `use-sign-out.test.tsx` **4/4**: empty queue signs out immediately; pending uploads open sync-or-discard sheet; discard signs out without drain; sync-then-sign-out drains then signs out. Live hosted sheet on device still **not** run.                                                                                                                                                                                                                                                                                                                                                                                             |
| Identity switching (cache / queue isolation)                                                  | `PASS` (automated cleanup + helpers + claim + session probe) / live not run | `sign-out-session.test.ts` **2/2**: signed-out cleanup disconnects PowerSync, clears sync enrollment, sets `local_only`/`powersync_unavailable`, remote sign-out, clears ledger selection + claim, removes households/household/migration/sync queries. Identity claim SecureStore seam **PASS** (`claim-store.test.ts` **8/8**). `sameIdentity` + per-user selection key isolation **PASS** (`identity.test.ts`, `ledger-selection-store.test.ts`). Async `probeSession` / `tryRemoteSignOut` **PASS** (`session-probe.test.ts` **13/13** including prior mapSnapshot). Live dual-identity switch still **BLOCKED** (tokens absent). |
| Sign-out / deletion on iOS and Android                                                        | not evidenced                                                               | Runtime section empty of pass paths.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

**Row status: `PARTIAL`.** Deletion/admin/household API seams + automated sync-or-discard / session-cleanup PASS; live device sign-out and identity switch still not certified.

### 8. Clean development setup after removal/reset using live or disposable services

| Sub-criterion                                                                  | Status                           | Evidence                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Better Auth / custom Household removal on `main`                               | predecessor done                 | HEAD is the #240 squash that closed #231. This ticket certifies composition; it did not re-implement removal.                                                                                                                                           |
| Disposable env reset (DB, WorkOS env, PowerSync, device stores)                | `SKIPPED` by #231/#240           | Reset was not performed. Cannot claim a clean start after reset.                                                                                                                                                                                        |
| Local disposable DB / worker mint                                              | `BLOCKED`                        | Absent locally: `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`); `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`. Explicit stamp: `powersync-disposable-reset-blocked.md`. |
| Webhook verify on local worker                                                 | `PARTIAL` local / `BLOCKED` prod | Local name may be present (value omitted). **Prod** `POST https://auth.trove.ing/webhooks/workos` → **503** disabled (`workos-webhook-blocked.md`; re-probe `workos-webhook-probe-2026-09-12d.txt` 06:30Z). Runner `WORKOS_WEBHOOK_SECRET` **ABSENT**.  |
| Live API reachable                                                             | `PASS` (health only)             | `https://auth.trove.ing` health **200 OK** (re-probe 06:30Z). Not a clean-install walkthrough.                                                                                                                                                          |
| Clean-install anonymous + login + personal sync + Household select after reset | not evidenced                    | Requires the skipped reset plus device runs.                                                                                                                                                                                                            |

Still BLOCKED for disposable mint/reset: `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`, `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`). Values are not claimed.

**Row status: `BLOCKED` (reset skipped + PowerSync/PlanetScale mint env absent).**

---

## Automated seam → row map

| Captured suite                                                         | Result                                                | Rows it partially satisfies                                               |
| ---------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `tsc --noEmit` mobile / api / auth / db                                | exit 0                                                | 1                                                                         |
| `pnpm lint` / `lint:fix`                                               | FAIL, 794 errors, pre-existing                        | 1 (not a #232 regression)                                                 |
| `pnpm format:check`                                                    | FAIL, 8 pre-existing files                            | 1 (not a #232 regression)                                                 |
| `@trove/auth` `vitest run`                                             | **14/14** `test-auth.txt`                             | 2 (token/callback contract), 4 (widget page)                              |
| `@trove/api` focused vitest (8 files)                                  | **97/97** `test-api-workos-seams.txt`                 | 3, 4, 5, 6, 7                                                             |
| `@trove/api` `pipeline.test.ts`                                        | **18/18** `test-pipeline-viewer-deny.txt`             | 4 (viewer), 5 (capability / cross-scope)                                  |
| `@trove/api` deletion + projection                                     | **18/18** `test-deletion-projection.txt`              | 6, 7                                                                      |
| `@trove/powersync` `pnpm test` (`node --test`)                         | **9/9** `test-powersync-proper.txt`                   | 3, 4, 5                                                                   |
| `@trove/powersync` via vitest                                          | FAIL runner mismatch `test-powersync.txt`             | ignore for product status                                                 |
| Ledger-scope `node --test`                                             | **5/5** `test-ledger-scope.txt`                       | 3, 5                                                                      |
| Mobile jest `use-enable-sync`, `use-sync-worker`, manifest, initialize | **19/19** `test-mobile-sync.txt`                      | 3, 7 (hooks only)                                                         |
| Mobile jest ledger-selection / return-to / identity helpers            | **17/17** `isolation-helpers-jest-2026-09-12.txt`     | 4 (selection encode), 5 (per-user isolation), 7 (sameIdentity)            |
| Mobile jest claim-store SecureStore seam                               | **8/8** `claim-store-jest-2026-09-12.txt`             | 5 (claim persistence / stale client seam), 7 (identity switch claim keys) |
| Mobile jest session-probe async                                        | **13/13** `session-probe-jest-2026-09-12.txt`         | 7 (`probeSession` / `tryRemoteSignOut` remote seam)                       |
| Mobile jest `selectLedgerSourceForAccess` local_only offlineReason     | **35/35** `ledger-source-offline-jest-2026-09-12.txt` | 6 (client kill_switch / powersync `offline_cached`)                       |
| Mobile jest memberships `toMembershipSummary` / `roleLabel`            | **4/4** `memberships-role-jest-2026-09-12.txt`        | 4 (client admin/member/viewer role boundary)                              |
| `pnpm test:ci` / CI Jest                                               | **PASS** tip stamp                                    | 1 (`ci-stamp-2026-09-12.txt` + prior `test-ci.txt`)                       |

API focused files in the 97: `powersync/token.test.ts` (4), `personal-budget-recurring.test.ts` (4), `deletion/service.test.ts` (5), `membership/projection.test.ts` (13), `migration/manifest.test.ts` (13), `import-bundle.test.ts` (15), `personal-ledger.test.ts` (18), `households/service.test.ts` (25).

---

## Runtime (stim / agent-device)

| Step                                                            | Status                                                                                           | Artifact                                                                                                                                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stim doctor ios`                                               | Ran (stim 1.0.0-rc.21). Notes only — not a product pass.                                         | `stim-doctor-ios.txt`                                                                                                                                                                               |
| `stim start`                                                    | Metro **200** on **8083**                                                                        | `stim-start.json` / `metro-health-*.txt`                                                                                                                                                            |
| `stim ios`                                                      | Prior build recovery on branch; **this AuthKit session did not rebuild** (`simctl launch` only). | `stim-ios-*.json`                                                                                                                                                                                   |
| agent-device (iOS AuthKit)                                      | **PARTIAL** — cancel PASS; email + code challenge reached; OTP hard-stopped (AX unavailable).    | `authkit-01-launch.png` … `authkit-21-signed-out-final.png`, `authkit-live-write.txt`                                                                                                               |
| Client id equality                                              | **EQUAL** (names only)                                                                           | `client-id-compare.txt` — `WORKOS_CLIENT_ID` == `EXPO_PUBLIC_WORKOS_CLIENT_ID` (EQUAL; values omitted)                                                                                              |
| Post-login protected API                                        | **PASS** (listMine + getManifest)                                                                | listMine **200** post-#250; getManifest CF **200** + iPhone 17 Pro UI upload offer (`post-schema-sync-retest.md`, `authkit-102-postschema-upload-offer.png`). **No stim**. Matrix still incomplete. |
| `stim doctor android` / `stim android` / agent-device (Android) | `BLOCKED` / not started                                                                          | `android-runtime-blocked.md` (prior `stim-doctor-android.txt` harness notes only)                                                                                                                   |
| Maestro / verify-trove flows                                    | not started                                                                                      | —                                                                                                                                                                                                   |

iOS email-code OTP completion, callback, restart, refresh, expiry, network recovery, and Android remain **uncertified**. Do not treat cancel PASS alone as row-2 complete.

---

## Env presence (names only)

### Present locally (`.env.local` / `apps/mobile/.env`)

- `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_CLAIM_TOKEN`, `WORKOS_COOKIE_PASSWORD`
- `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_WORKOS_REDIRECT_URI`
- `EXPO_PUBLIC_SERVER_URL` (`https://auth.trove.ing`)

### Equality checks (no values)

| Check                                                | Result                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `WORKOS_CLIENT_ID` == `EXPO_PUBLIC_WORKOS_CLIENT_ID` | **EQUAL** (`client-id-compare.txt`) — mismatch cleared; does **not** block post-login by itself |

### Present for webhook (names only)

| Name                    | Notes                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `WORKOS_WEBHOOK_SECRET` | **Present** locally (value omitted). **Prod** Alchemy/env binding is **empty** → live receiver **503** (`workos-webhook-blocked.md`). |

### Absent locally (block the named capability)

| Absent name(s)                                                                                             | Blocks                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`                                          | Local worker mint; live PowerSync removal-bound measure from this machine.                                                      |
| `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`) | Local disposable DB reset / mint.                                                                                               |
| `EXPO_PUBLIC_POWERSYNC_URL`                                                                                | Not required if the client takes the endpoint from the API token response against `auth.trove.ing`. Still not two-device proof. |

Do not claim secret values.

---

## Commands used

```bash
# Typecheck (reported exit 0; no tsc log files in this directory)
npx tsc --noEmit   # apps/mobile, packages/api, packages/auth, packages/db

# Lint / format (failed; pre-existing)
pnpm lint          # -> lint.txt (oxlint, 794 error lines)
pnpm lint:fix      # -> lint-fix.txt
pnpm format:check  # -> format-check.txt (8 files)

# Focused automated suites
pnpm --filter @trove/auth test
# vitest run in packages/auth -> test-auth.txt (14/14)

# packages/api focused (97/97) -> test-api-workos-seams.txt
# token, personal-budget-recurring, deletion, projection, manifest,
# import-bundle, personal-ledger, households

# deletion + projection repeat (18/18) -> test-deletion-projection.txt

# PowerSync: vitest is the wrong runner -> test-powersync.txt FAIL
pnpm --filter @trove/powersync test
# node --test sync-streams.test.ts -> test-powersync-proper.txt (9/9)

# ledger-scope node --test -> test-ledger-scope.txt (5/5)

# apps/mobile focused jest -> test-mobile-sync.txt (19/19)
# hooks/use-enable-sync.test.tsx
# hooks/use-sync-worker.test.tsx
# lib/migration/manifest.test.ts
# db/initialize.test.ts

# NOT run locally this write (CI stamp used instead)
# pnpm test:ci
# Local PowerSync mint / disposable reset (env absent — see powersync-disposable-reset-blocked.md)

# Runtime harness (not a product pass)
stim doctor ios    # -> stim-doctor-ios.txt
stim start --json  # -> stim-start.json (port 8083)
```

---

## Artifact index (`artifacts/issue-232/`)

| File                                                        | What it is                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `acceptance-matrix.md`                                      | This matrix.                                                                                            |
| `ci-stamp-2026-09-12.txt`                                   | PR #241 tip CI: Typescript + Jest + EAS SUCCESS; GitGuardian FAILURE noted.                             |
| `android-runtime-blocked.md`                                | Android runtime **BLOCKED** / not started (no device).                                                  |
| `powersync-disposable-reset-blocked.md`                     | PowerSync removal + disposable reset **BLOCKED** (env names).                                           |
| `planetscale-schema-ddl-confirm-2026-09-12b.txt`            | Second DDL 0011–0015 PlanetScale reconfirm **PASS**.                                                    |
| `workos-webhook-probe-2026-09-12b.txt`                      | Webhook re-probe still **503** (05:47Z).                                                                |
| `workos-webhook-probe-2026-09-12d.txt`                      | Webhook re-probe still **503** (06:30Z); health **200**.                                                |
| `isolation-helpers-jest-2026-09-12.txt`                     | ledger-selection / return-to / identity Jest **17/17** Relates stamp.                                   |
| `claim-store-jest-2026-09-12.txt`                           | claim-store SecureStore read/write/clear Jest **8/8** Relates stamp.                                    |
| `membership-revocation-jest-2026-09-12.txt`                 | plan-membership-revocation + normalizeLedgerSelection Jest Relates stamp (**38/38** with access suite). |
| `session-probe-jest-2026-09-12.txt`                         | session-probe async `probeSession` / `tryRemoteSignOut` Jest **13/13** Relates stamp.                   |
| `ledger-source-offline-jest-2026-09-12.txt`                 | `selectLedgerSourceForAccess` local_only offlineReason Jest **35/35** Relates stamp.                    |
| `memberships-role-jest-2026-09-12.txt`                      | memberships `toMembershipSummary` / `roleLabel` Jest **4/4** Relates stamp.                             |
| `create-account-hittest-status.md`                          | Create Account hit-test stamp: upload PASS; round-trip BLOCKED; #258 Mac ghosting.                      |
| `post-pressable-upload-pass.md`                             | Pressable personal upload **PASS** (tip `fb8c786`).                                                     |
| `post-pressable-roundtrip-blocked.md`                       | One-device round-trip **BLOCKED** (Create Account NativeHost).                                          |
| `create-account-pressable-254-blocked.md`                   | #254 Pressable Create Account retest **BLOCKED**.                                                       |
| `create-account-hittest255-blocked.md`                      | #255 NativeHost Create Account retest **BLOCKED**.                                                      |
| `create-account-fresh-mac-blocked.md`                       | #256 Metro-confirmed Create Account MISS tip `c9a3ca8`.                                                 |
| `api-matrix-non-device.md`                                  | Non-device Relates summary: listMine / getManifest / claim_iss PASS + isolation PARTIAL + blocked rows. |
| `api-isolation-live-2026-09-12.md`                          | API-only auth-gate + viewer pipeline + schema reconfirm; live dual-identity **BLOCKED**.                |
| `live-auth-gate-probe-2026-09-12.txt`                       | Live curl: missing/forged JWT → **401**; webhook still **503**.                                         |
| `planetscale-schema-ddl-confirm-2026-09-12.txt`             | PlanetScale read-only DDL 0011–0015 column reconfirm.                                                   |
| `test-pipeline-viewer-deny.txt`                             | `pipeline.test.ts` **18/18** (viewer capability map).                                                   |
| `cf-api-corroboration-2026-09-12.txt`                       | CF Observability re-query stamp (counts only; no secrets).                                              |
| `ios-otp-ax-blocker.md`                                     | Durable iOS OTP AX **BLOCKER** for owner decision (not a PASS).                                         |
| `workos-webhook-blocked.md`                                 | Prod webhook **BLOCKED** — empty `WORKOS_WEBHOOK_SECRET` → **503**.                                     |
| `workos-webhook-probe-2026-09-12.txt`                       | Live curl transcript (no secrets).                                                                      |
| `post-schema-sync-retest.md`                                | Post-DDL 0011–0015 getManifest **PASS** (CF Worker 200 citations).                                      |
| `revision.txt`                                              | Earlier revision stamp.                                                                                 |
| `authkit-live-write.txt`                                    | This AuthKit write stamp (HEAD, #242 note, OTP hard-stop).                                              |
| `client-id-compare.txt`                                     | `WORKOS_CLIENT_ID` vs `EXPO_PUBLIC_WORKOS_CLIENT_ID` equality result only.                              |
| `authkit-01-launch.png` … `authkit-21-signed-out-final.png` | iOS AuthKit live screenshots (cancel, email, code challenge, signed-out final).                         |
| `lint.txt` / `lint-fix.txt` / `format-check.txt`            | Pre-existing lint/format failures.                                                                      |
| `test-auth.txt`                                             | `@trove/auth` 14/14.                                                                                    |
| `test-api-workos-seams.txt`                                 | `@trove/api` focused 97/97.                                                                             |
| `test-deletion-projection.txt`                              | deletion + projection 18/18.                                                                            |
| `test-powersync-proper.txt`                                 | `node --test` 9/9.                                                                                      |
| `test-ledger-scope.txt`                                     | ledger-scope 5/5.                                                                                       |
| `test-mobile-sync.txt`                                      | mobile jest 19/19.                                                                                      |
| `test-ci.txt`                                               | full `pnpm test:ci` pass (prior).                                                                       |
| `stim-doctor-ios.txt` / `stim-start.json`                   | harness notes / Metro.                                                                                  |

---

## What would close #232

1. Finish iOS OTP + callback (or alternate automation that can type into AuthKit digit boxes) and Android runtime rows 2–4 and 7 with artifact paths.
2. Clear Create Account / one-device personal sync round-trip on device (next candidate #258 tip `709acf8` pending Mac retest after self-hosted unghost) — keep Relates-only until PASS. **Do not invent PASS.**
3. Align `WORKOS_CLIENT_ID` with `EXPO_PUBLIC_WORKOS_CLIENT_ID` (names only), then retest one protected oRPC call against live `auth.trove.ing` (#242 already deployed).
4. Keep lint/format classified as pre-existing unless a new regression appears.
5. Measure PowerSync existing-connection removal and the offline-device limitation, or keep those sub-criteria `BLOCKED` with the env names in `powersync-disposable-reset-blocked.md`.
6. Either perform the skipped disposable reset and reproduce clean setup (row 8), or keep row 8 `BLOCKED` and **do not** claim #232 complete.
7. Set prod `WORKOS_WEBHOOK_SECRET` from WorkOS dashboard signing secret, redeploy, confirm `POST /webhooks/workos` is no longer **503**, then re-certify membership webhook projection.
8. Keep #224 open. Do not merge as certified. Do not deploy to production. **Do not use Closes #232** until certification is actually complete.

## Post-login Sync evidence (2026-09-11T21:44Z)

- Metro `:8083` **200**; stim-mobile UDID `F324175E-BCA2-4F20-857E-C2D9678D44F5` (no iOS rebuild).
- Signed-in confirmed: `stringsaeed@gmail.com`, **Sign out** (`authkit-56-current.png`).
- Household **Try again** + **Sync just for me** driven; Sync → UI **Unauthorized** (`authkit-58-after-sync-just-for-me.png`).
- CFNetwork: `response_status=401` correlated with Sync tap (`cfnetwork-http-hits.txt`, `cfnetwork-401-summaries.txt`). Target API `https://auth.trove.ing` (`EXPO_PUBLIC_SERVER_URL`); `/rpc` path via oRPC client.
- Env hard-stop names **absent** (names only): `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`, `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`) — see `env-hard-stop.txt`.
- Screenshots: `authkit-56`…`authkit-60-unauthorized-final.png`.
- **Not certified.** Relates to #232 only. Parent #224 stays open. No Closes.

## Post-#245 Sync retest (2026-09-11T23:34Z)

- Deploy Worker [34657777870](https://github.com/Stringsaeed/money-management/actions/runs/34657777870) **success** on `cb3c90c` (#245 CF-readable auth/orpc codes) live on `auth.trove.ing`.
- Owner CF log for Sync / `POST /rpc/households/listMine`: **`Unauthorized (claim_iss)`** → root code **`claim_iss`** (not `missing_token`).
- Stored access-token middle-segment metadata only (`post-245-claim-iss.txt`):
  - `iss=https://api.workos.com/user_management/client_01M11FD9X26FA35C5Y9YCK2KG9`
  - `aud_present=false`
  - `client_id_present=true`
  - `sub_present=true`
  - raw JWT / signature / other PII **not** logged
- Implication: configure `WORKOS_TOKEN_ISSUER` to that `iss` (default `https://api.workos.com` mismatches). **Superseded by post-#246** (issuer accept landed; new failure is user upsert 500).
- Historical FAIL at JWT verify. Relates to #232 only. Parent #224 stays open. No Closes.

## Post-#246 Sync retest (2026-09-11T23:50Z)

- Deploy Worker [34659057570](https://github.com/Stringsaeed/money-management/actions/runs/34659057570) **success** on `5899747` (#246 AuthKit `iss` accept) live on `auth.trove.ing`.
- Signed-in Profile → **Sync just for me** (`authkit-71-post246-open.png` → `authkit-72-post246-after-sync.png`).
- **Auth / JWT verify:** **PASS** — prior `claim_iss` cleared; request reaches handler.
- **`households.listMine`:** **FAIL** — UI **Internal server error**; CFNetwork `response_status=500` (`cfnetwork-500-post246.txt`).
- Owner CF: `orpc_error code=UNKNOWN` — Failed query `insert into "user" … on conflict do nothing` (params shape only: WorkOS user id; name=same as id; email `{id}@users.workos.invalid`; `email_verified=true`). No raw JWT / secret values logged.
- Client-visible: `client-visible-error-post246.txt` / agent-device snapshots.
- DB upsert fix owned by a separate cloud worker — not fixed in this evidence push.
- **Still FAIL / not certified.** Matrix rows still blocked: OTP/callback AX, Android runtime, live PowerSync/PlanetScale mint envs (names in `env-hardstop-absent.txt`), disposable reset (#231 skip), live webhook apply. Relates to #232 only. Parent #224 stays open. No Closes.
