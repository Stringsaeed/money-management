# Issue #232 — WorkOS migration acceptance matrix

Certification matrix for [GitHub #232](https://github.com/Stringsaeed/money-management/issues/232) (*WorkOS: certify the complete migration on iOS and Android*). Evidence is from worktree `/Users/saeed/Work/money-management-wt-232` only. No secret values are recorded.

## Publication / governance

| Rule | State |
| --- | --- |
| Parent [#224](https://github.com/Stringsaeed/money-management/issues/224) | **Stays open** for owner review. Do not close or rewrite the spec. |
| This issue #232 | **Open.** Certification is **not complete**. Do not count blocked required cases as passing. |
| Merge | **Do not merge.** Issue implementation is not authorization to merge. |
| Production deploy | **Do not deploy** to production. |
| Development reset | [#231](https://github.com/Stringsaeed/money-management/issues/231) / [PR #240](https://github.com/Stringsaeed/money-management/pull/240) **skipped** the disposable-environment reset. Row 8 is blocked on that skip plus missing local env names. |

Report implementation, automated verification, runtime verification, and publication **separately**. This document is the verification record; it does not authorize publication.

## Revision

| Field | Value |
| --- | --- |
| Repo | `Stringsaeed/money-management` |
| Branch | `cursor/workos-certify-migration-b3d1` |
| HEAD | tip `PENDING_DOCS` validateMoveRequest stamp — product `3b821bc` (`validateMoveRequest` **2/2** new; suite **2/2**); remaining **BLOCKED**: webhook **503**, #258 Create Account, dual-token, GH Actions billing, Android, OTP AX, PowerSync mint |
| Provenance | Squash merge of #240 / closes #231 on `main`, plus [#242](https://github.com/Stringsaeed/money-management/pull/242), [#245](https://github.com/Stringsaeed/money-management/pull/245), [#246](https://github.com/Stringsaeed/money-management/pull/246), and schema **0011–0015** on PlanetScale `trove/main`. |
| Worktree | `/tmp/wt-workos-certify-b3d1` (this Relates webhook re-probe); prior Mac evidence from `/Users/saeed/Work/money-management-wt-232` |
| Live API | `https://auth.trove.ing` — root **200 OK** (2026-09-12T07:54:12Z); Sync `getManifest` CF Worker **200** post-DDL; webhook still **503** |
| Device (this write) | **none** — API/docs-only; no iOS/Android device; no Mac |
| Test mailbox | Gmail MCP `stringsaeed@gmail.com` (WorkOS staging codes observed). Available for live email-code runs; **not** proof that OTP completion passed. |

Recorded in `revision.txt` / `create-account-hittest-status.md` / `ci-stamp-2026-09-12.txt` / `ci-billing-blocked-2026-09-12.txt` / `post-schema-sync-retest.md` / `isolation-helpers-jest-2026-09-12.txt` / `claim-store-jest-2026-09-12.txt` / `membership-revocation-jest-2026-09-12.txt` / `session-probe-jest-2026-09-12.txt` / `ledger-source-offline-jest-2026-09-12.txt` / `memberships-role-jest-2026-09-12.txt` / `access-core-capabilities-jest-2026-09-12.txt` / `workos-webhook-probe-2026-09-12e.txt` / `workos-webhook-probe-2026-09-12d.txt` / `workos-verify-env-jest-2026-09-12.txt` / `widget-handoff-jest-2026-09-12.txt` / `reconcile-freshness-jest-2026-09-12.txt` / `command-shared-ledger-powersync-jest-2026-09-12.txt` / `sole-admin-budget-pure-jest-2026-09-12.txt` / `card-dependency-setup-draft-jest-2026-09-12.txt` / `import-content-jest-2026-09-12.txt` / `to-directory-membership-jest-2026-09-12.txt` / `import-manifest-canonical-jest-2026-09-12.txt` / `household-role-command-kind-jest-2026-09-12.txt` / `covers-effects-jest-2026-09-12.txt` / `period-helpers-jest-2026-09-12.txt` / `session-from-claims-jest-2026-09-12.txt` / `bind-ledger-scope-jest-2026-09-12.txt` / `is-plan-rejection-jest-2026-09-12.txt` / `household-import-binding-jest-2026-09-12.txt` / `new-deletion-operation-id-jest-2026-09-12.txt` / `command-scope-precondition-schema-jest-2026-09-12.txt` / `create-payload-schemas-jest-2026-09-12.txt` / `recurring-change-payload-schema-jest-2026-09-12.txt` / `update-archive-account-payload-schemas-jest-2026-09-12.txt` / `edit-remove-transaction-payload-schemas-jest-2026-09-12.txt` / `create-update-category-payload-schemas-jest-2026-09-12.txt` / `archive-category-payload-schema-jest-2026-09-12.txt` / `to-wire-account-type-jest-2026-09-12.txt` / `budget-period-of-jest-2026-09-12.txt` / `date-after-jest-2026-09-12.txt` / `settlement-effects-jest-2026-09-12.txt` / `format-activity-full-timestamp-jest-2026-09-12.txt` / `pending-lifecycle-settlement-jest-2026-09-12.txt` / `envelope-category-mapping-content-jest-2026-09-12.txt` / `funding-rollover-content-jest-2026-09-12.txt` / `assignment-content-jest-2026-09-12.txt` / `recurring-rule-content-jest-2026-09-12.txt` / `ledger-read-fields-jest-2026-09-12.txt` / `create-console-sink-jest-2026-09-12.txt` / `create-metrics-sink-jest-2026-09-12.txt` / `apply-ledger-filters-jest-2026-09-12.txt` / `change-effects-jest-2026-09-12.txt` / `date-range-of-jest-2026-09-12.txt` / `validate-move-request-jest-2026-09-12.txt`.


## WorkOS webhook live re-probe (2026-09-12T07:54:12Z, no device)

- Live `GET https://auth.trove.ing/` → **200** `OK` (auth health).
- Live `POST https://auth.trove.ing/webhooks/workos` (no signature, empty JSON) → **503** `Webhook receiver is disabled: WORKOS_WEBHOOK_SECRET is not configured.`
- Live `GET /webhooks/workos` → **404** (POST-only).
- Runner `WORKOS_WEBHOOK_SECRET` **ABSENT** — did not invent secrets. Verdict unchanged: **BLOCKED**.
- Evidence: `workos-webhook-probe-2026-09-12e.txt` + `workos-webhook-blocked.md`. Relates to #232 only. Do not Closes #232/#224. Matrix still incomplete.

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

- Extended `apps/mobile/utils/activity.test.ts` — **2/2 new PASS** / suite **12/12** (`format-activity-full-timestamp-jest-2026-09-12.txt`): absolute `MMM d, yyyy at h:mm a` detail stamp; year + ` at ` separator for `@/utils/activity` `formatActivityFullTimestamp`.
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
- Annotation: *The job was not started because recent account payments have failed or your spending limit needs to be increased.*
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

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
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

| Status | Meaning |
| --- | --- |
| `PASS` | Required evidence exists and the case succeeded. |
| `FAIL` | Required check ran and failed. Call out pre-existing vs regression. |
| `PARTIAL` | Some sub-criteria have evidence; others are missing, blocked, or not in the captured suite. |
| `BLOCKED` | Cannot run a required case. Missing env **names** listed; no values. |
| `SKIPPED` | Intentionally not run, or predecessor skipped the work. |
| `IN PROGRESS` | Harness started. **Do not treat as pass.** Parent fills the Runtime section when artifacts exist. |

A row is complete only when every required sub-criterion is `PASS` (or an explicitly accepted skip with evidence). `PARTIAL` / `BLOCKED` / `IN PROGRESS` / `SKIPPED` are **not** completion.

---

## Matrix

### 1. Type / lint / format / CI on the integrated revision

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| `tsc --noEmit` `apps/mobile` | `PASS` | GitHub Actions **Typescript check** SUCCESS on tip `ded1e97` (`ci-stamp-2026-09-12.txt`, run 34675791245). Prior local exit 0 also reported. |
| `tsc --noEmit` `packages/api` | `PASS` | Covered by same CI Typescript job + prior local exit 0. |
| `tsc --noEmit` `packages/auth` | `PASS` | Same. |
| `tsc --noEmit` `packages/db` | `PASS` | Same. |
| `pnpm lint` / `pnpm lint:fix` | `FAIL` (pre-existing) | `lint.txt`, `lint-fix.txt`. **794** `error` lines (anti-slop / complexity). Not a #232 regression: product code unchanged on this branch. |
| `pnpm format:check` | `FAIL` (pre-existing) | `format-check.txt`. 8 files: `apps/mobile/components/ui/input.tsx`, five `artifacts/powersync-planetscale*` paths, `internal/228-wip-gap-checklist.md`. Not a #232 regression. |
| Full `pnpm test:ci` / CI Jest | `PASS` | Prior `test-ci.txt` (Jest **742** + cutover **3**). Tip `ded1e97` GitHub Actions **Jest** SUCCESS (`ci-stamp-2026-09-12.txt`, run 34675791249). EAS Preview SUCCESS. GitGuardian FAILURE recorded (not product FAIL). |

**Row status: `PARTIAL`.** Typecheck + Jest CI pass on tip; lint/format fail pre-existing (not #232 regressions). GitGuardian failure noted separately.

### 2. Email-code sign-in, cancel, callback validation, restart, refresh rotation, session expiry, transient network recovery — iOS and Android

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Access-token verify (issuer / audience / expiry / bearer) | `PARTIAL` (automated only) | `@trove/auth` vitest **14/14** in `test-auth.txt`. Does **not** prove hosted AuthKit PKCE return on device. #242 (`44fde92`) is live on `auth.trove.ing` (aud/`client_id` fix). |
| Email-code sign-in (live iOS) | `PARTIAL` / hard-stopped | Reached WorkOS AuthKit staging email page + **Check your email** / 6-box challenge (`authkit-07-workos-page.png`, `authkit-08-email-filled.png`, `authkit-09-code-challenge.png`). OTP entry **BLOCKED**: agent-device reports AX-unavailable inside ASWebAuthenticationSession; `fill` selects page text instead of digit boxes. Final UI still signed out (`authkit-21-signed-out-final.png`). Android not started. |
| Cancel abandoned sign-in | `PASS` (iOS) | Sheet open → Cancel → Settings (`authkit-03-sheet-open.png`, `authkit-04-cancel.png`). |
| Callback / state validation on return | not evidenced on device | OTP not completed; no PKCE callback artifact. |
| Restart survives session | not evidenced | No signed-in session. |
| Refresh rotation | not evidenced | No signed-in session. |
| Session expiry | not evidenced on device | Automated expired-token coverage in `@trove/auth` only. |
| Transient network recovery | not evidenced | No runtime artifact. |
| Post-login JWT verify (issuer) | `PASS` (post-#246) | #246 Deploy Worker [34659057570](https://github.com/Stringsaeed/money-management/actions/runs/34659057570) on `5899747` cleared prior `claim_iss`. Sync progresses past JWT verify. |
| Post-login protected oRPC / bearer (`listMine`) | `PASS` (post-#250) | HTTP **200** `{"json":[]}` (`post-250-sync-retest.md`). |
| Post-login Sync `migration/getManifest` | `PASS` (post-schema 0011–0015) | CF Worker **200** (216ms / 412ms); iPhone 17 Pro UI **Upload to your cloud?** (`post-schema-sync-retest.md`, `authkit-102-postschema-upload-offer.png`). Prior ledger_id **42703** cleared. |
| iOS development build | prior FAIL then recovered | ExpoSQLite vendor + Metro `.rnrepo-cache` blockList on this branch; post-schema retest used **iPhone 17 Pro** (`simctl` / agent-device; **no stim**). |
| Android development build | `BLOCKED` / not started | No Android agent-device artifacts. Explicit stamp: `android-runtime-blocked.md`. **Do not claim Android pass.** |

**Row status: `PARTIAL` (cancel PASS; email challenge PARTIAL; OTP/callback hard-stopped; JWT verify PASS; `listMine` PASS; `getManifest` PASS post-DDL). Full row-2 still incomplete (OTP/Android/session rows).**

Notes: OTP automation blocked by AuthKit webview AX (not an env-name blocker) — durable owner note `ios-otp-ax-blocker.md`. Client ids **EQUAL**. JWT issuer accept **PASS** (#246). `listMine` **PASS** (post-#250; CF re-query in `cf-api-corroboration-2026-09-12.txt` / `api-matrix-non-device.md`). Still BLOCKED for live PowerSync/PlanetScale mint: `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`, `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`) — `env-hardstop-absent.txt`. `WORKOS_WEBHOOK_SECRET` **present** locally (value omitted) — live webhook apply still not evidenced.

Env present (names only) that this row can use: `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_CLAIM_TOKEN`, `WORKOS_COOKIE_PASSWORD`, `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_WORKOS_REDIRECT_URI`, `EXPO_PUBLIC_SERVER_URL`.

### 3. Anonymous use, confirmed first upload, populated cloud + separate device data, two-device personal sync without orgs

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Personal ledger without a Household | `PARTIAL` (API seam) | `test-api-workos-seams.txt`: `personal-ledger.test.ts` **18** (creates/joins no Household; isolation; import on personal scope). `personal-budget-recurring.test.ts` **4**. `test-ledger-scope.txt` **5/5** (personal vs organization ledger ids). |
| Confirmed first upload / import manifest | `PASS` (live getManifest + Pressable upload) | Live `POST /rpc/migration/getManifest` **200** after DDL 0011–0015 (`post-schema-sync-retest.md`). Pressable confirm → Uploading… → enabled at tip `fb8c786` (`post-pressable-upload-pass.md`). Automated: `import-bundle.test.ts` **15**, `manifest.test.ts` **13**; mobile hook tests **19/19**. Two-store / two-device proof still not certified. |
| One-device personal sync round-trip (Create Account → txn → Synced) | `BLOCKED` | Add Account **Create Account** hit-test miss after #254/#255/#256. Metro-confirmed MISS tip `c9a3ca8` (`create-account-fresh-mac-blocked.md`; cert evidence `9e3f69f`). Next candidate [#258](https://github.com/Stringsaeed/money-management/pull/258) tip `709acf8` — Mac retest **BLOCKED** (self-hosted agents ghosting). **Not** PASS. `create-account-hittest-status.md`. |
| Anonymous local-only use | not evidenced | Requires device. No stim/agent-device proof. |
| Populated cloud opens separately; device ledger preserved; no auto-merge | not evidenced live | Same mobile/API seams are not two-store device proof. |
| Two-device personal core / budget / recurring sync, no orgs | not evidenced | No second-device run. `EXPO_PUBLIC_POWERSYNC_URL` absent locally; client may obtain the endpoint from the API token response when hitting `auth.trove.ing`. That does **not** certify two-device sync. |

**Row status: `PARTIAL` — personal upload PASS; Create Account round-trip `BLOCKED`; two-device not run.**

### 4. Explicit Household create, multi-Household switch, invitations, management return, admin/member/viewer, personal-data privacy

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Explicit Household create (no implicit org on sign-in) | `PARTIAL` (API seam) | `households/service.test.ts` **25** in `test-api-workos-seams.txt` (`createHousehold`, retries, list/get, invite, roles, last-admin, delete, widget handoff). Personal-ledger tests assert sign-in/write does not create a Household. |
| Multi-Household switch | `PARTIAL` (encode/decode seam) / live not run | Per-user ledger selection encode/decode/clear **PASS** automated (`ledger-selection-store.test.ts`); live device selector switch still **not** evidenced. |
| Invitations via WorkOS | `PARTIAL` (API seam) | `member administration > lets only admins invite, through WorkOS invitations`. No live invite acceptance. |
| Management-page return (widget) | `PARTIAL` (API + auth) | Widget handoff + expired/demoted-admin codes in households tests; `@trove/auth` member-widget-page **3**. No iOS/Android return artifact. |
| Admin / member / viewer | `PARTIAL` (API + client role map) | Import-bundle rejects member/viewer bulk-import; households role changes; PowerSync streams deny inactive/unknown roles (`test-powersync-proper.txt` **9/9**). Viewer command deny **PASS** in `pipeline.test.ts` **18/18** (`test-pipeline-viewer-deny.txt`). Client `toMembershipSummary` / `roleLabel` **PASS** (`memberships.test.ts` **4/4**) — unknown slugs dropped; admin/member/viewer mapped. Device role UX not run; live viewer bearer absent. |
| Personal data stays private on create/join | `PARTIAL` (API seam) | Personal vs Household isolation in personal-ledger + budget-recurring + PowerSync streams. No live create/join privacy proof. |
| Webhook-driven membership apply | `BLOCKED` (prod) | Live `POST /webhooks/workos` on `auth.trove.ing` → **503** `WORKOS_WEBHOOK_SECRET is not configured.` (`workos-webhook-blocked.md`, `workos-webhook-probe-2026-09-12d.txt` 06:30Z). Runner name **ABSENT**. Local name may be present; **prod binding empty**. Not 404/401/500. |

**Row status: `PARTIAL` automated / live not run / webhook apply `BLOCKED` (prod secret missing).**

### 5. Cross-User/Household API/stream isolation, cross-scope financial-ref rejection, queued writes after role downgrade, stale-response handling

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Cross-User personal isolation | `PARTIAL` (API + streams) | Personal-ledger isolation (invisible, not merely forbidden); personal budget/recurring cross-user reject; PowerSync personal stream scoped by owner (`test-powersync-proper.txt`). Live dual-identity probe **BLOCKED** — absent `CERT_USER_A_TOKEN` / `CERT_USER_B_TOKEN` (and WorkOS mint names). |
| Cross-Household / stream isolation | `PARTIAL` (API + streams) | Households `getHousehold` invisible to non-members; PowerSync “Personal Ledger and Household streams from bleeding”; household queries membership-guarded. Live dual-identity probe **BLOCKED** (same missing token names). |
| Cross-scope financial-reference rejection | `PARTIAL` (API seam) | Personal-ledger rejects addressing another User’s account / category / envelope; organization-scope rejects a non-member. Viewer capability map now **PASS** in `pipeline.test.ts` **18/18** (`test-pipeline-viewer-deny.txt`). Live viewer bearer still absent. |
| Queued writes after role downgrade | `PASS` (automated) | `ledger.test.ts` rechecks live membership after member→viewer demotion and forbids the drained `transaction.create`; `connector.test.ts` completes CRUD and records `forbidden` in `rejected_changes` (does not leave the batch stuck). Live multi-device demotion still not run. |
| Stale-response handling | `PARTIAL` (events + client cleanup + selection/identity/claim helpers) | Membership projection stale/older/delayed observations (`test-deletion-projection.txt` **18/18**, also inside the 97). Client sign-out cleanup clears PowerSync + sync enrollment + claim/selection + query caches (`sign-out-session.test.ts` **2/2`). Membership-revocation planner **PASS** (`plan-membership-revocation.test.ts` **5/5**): enrollment-loss → sync clear plan; stale Household selection clear; Personal untouched; claim untouched. `normalizeLedgerSelection` stale id → Personal **PASS** (`access.test.ts`). Per-user selection clear + `sameIdentity` mismatch helpers **PASS** (`ledger-selection-store.test.ts`, `identity.test.ts`) — automated only; live stale HTTP/sync after identity switch still **not** device-certified. |
| Live API/stream isolation | `PARTIAL` (auth-gate) / dual-identity `BLOCKED` | Auth-gate **PASS**: missing → **401** `missing_token`; forged JWT + forged org/user body → **401** `invalid_token` (`live-auth-gate-probe-2026-09-12.txt`; CF **7**+**8**). Authenticated cross-tenant negatives **BLOCKED** without dual session tokens. |

**Row status: `PARTIAL`.** Isolation seams + auth-gate + viewer pipeline + automated demotion-queue PASS; live dual-identity and client stale-response after identity switch are **not** certified.

### 6. Duplicated / reordered / missed events + reconciliation; PowerSync removal / offline-device limitation

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Duplicate membership events | `PASS` (API seam) | `projectMembership ordering rule > applies the same event twice without changing anything`. |
| Reordered / delayed / missed events + reconciliation | `PASS` (API seam) | Older-after-newer ignored; delayed newer wins; deletion tombstone vs stale created; bootstrap tombstones; `listMyHouseholds` drops a membership WorkOS no longer lists. |
| Unknown Household/User refuse | `PASS` (API seam) | Projection refuses unknown Households/Users; households ignore unknown Organizations. |
| PowerSync connection removal (measured bound) | `BLOCKED` | Not measured. Local worker mint blocked — absent: `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`. Explicit stamp: `powersync-disposable-reset-blocked.md`. GitHub Actions secrets **do** include `POWERSYNC_*` (names only; values not claimed). Stream **config** tests (`test-powersync-proper.txt` **9/9**) are not a live removal bound. |
| Offline-device limitation (cannot observe remote removal until reconnect) | `BLOCKED` / not measured | No offline-device run. Same mint env hard-stop. Do not promise remote erasure while disconnected. |
| Client `local_only` / `kill_switch` → ledger `offline_cached` | `PASS` (automated) / live not run | `selectLedgerSourceForAccess` in `access.test.ts`: `kill_switch` → `Sync is temporarily unavailable.`; `powersync_unavailable` → `PowerSync has been disconnected for over 10 minutes.` (`ledger-source-offline-jest-2026-09-12.txt`, suite **35/35**). Not a live offline-device measure. |

**Row status: `PARTIAL` (event seams + client offlineReason) + `BLOCKED` (live PowerSync removal / offline measure).**

Note: `test-powersync.txt` is a **failed** `vitest run` (`No test suite found` / `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`). The package script is `node --test sync-streams.test.ts`. The proper run is `test-powersync-proper.txt` **9/9**. The vitest miss is a runner mismatch, not a product regression.

### 7. Sync-or-discard sign-out, identity switching, User deletion preserving shared history, last-admin guard, recoverable Household deletion

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| User deletion anonymizes attribution, clears personal data, ignores delayed membership events | `PASS` (API seam) | `deletion/service.test.ts` in `test-api-workos-seams.txt` and `test-deletion-projection.txt`. |
| Last-admin / sole-admin User-deletion guard | `PASS` (API seam) | `requestUserDeletion > blocks sole admins until they appoint another admin or delete the Household`; households `keeps the last admin in place`. |
| Recoverable Household deletion | `PASS` (API seam) | Confirm-name + admin-only; shared ledger removed, personal kept, org tombstoned; resumes after WorkOS failure without duplicating local deletes. |
| Sync-or-discard sign-out | `PASS` (automated) / live not run | `use-sign-out.test.tsx` **4/4**: empty queue signs out immediately; pending uploads open sync-or-discard sheet; discard signs out without drain; sync-then-sign-out drains then signs out. Live hosted sheet on device still **not** run. |
| Identity switching (cache / queue isolation) | `PASS` (automated cleanup + helpers + claim + session probe) / live not run | `sign-out-session.test.ts` **2/2**: signed-out cleanup disconnects PowerSync, clears sync enrollment, sets `local_only`/`powersync_unavailable`, remote sign-out, clears ledger selection + claim, removes households/household/migration/sync queries. Identity claim SecureStore seam **PASS** (`claim-store.test.ts` **8/8**). `sameIdentity` + per-user selection key isolation **PASS** (`identity.test.ts`, `ledger-selection-store.test.ts`). Async `probeSession` / `tryRemoteSignOut` **PASS** (`session-probe.test.ts` **13/13** including prior mapSnapshot). Live dual-identity switch still **BLOCKED** (tokens absent). |
| Sign-out / deletion on iOS and Android | not evidenced | Runtime section empty of pass paths. |

**Row status: `PARTIAL`.** Deletion/admin/household API seams + automated sync-or-discard / session-cleanup PASS; live device sign-out and identity switch still not certified.

### 8. Clean development setup after removal/reset using live or disposable services

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Better Auth / custom Household removal on `main` | predecessor done | HEAD is the #240 squash that closed #231. This ticket certifies composition; it did not re-implement removal. |
| Disposable env reset (DB, WorkOS env, PowerSync, device stores) | `SKIPPED` by #231/#240 | Reset was not performed. Cannot claim a clean start after reset. |
| Local disposable DB / worker mint | `BLOCKED` | Absent locally: `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`); `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`. Explicit stamp: `powersync-disposable-reset-blocked.md`. |
| Webhook verify on local worker | `PARTIAL` local / `BLOCKED` prod | Local name may be present (value omitted). **Prod** `POST https://auth.trove.ing/webhooks/workos` → **503** disabled (`workos-webhook-blocked.md`; re-probe `workos-webhook-probe-2026-09-12d.txt` 06:30Z). Runner `WORKOS_WEBHOOK_SECRET` **ABSENT**. |
| Live API reachable | `PASS` (health only) | `https://auth.trove.ing` health **200 OK** (re-probe 06:30Z). Not a clean-install walkthrough. |
| Clean-install anonymous + login + personal sync + Household select after reset | not evidenced | Requires the skipped reset plus device runs. |

Still BLOCKED for disposable mint/reset: `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`, `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`). Values are not claimed.

**Row status: `BLOCKED` (reset skipped + PowerSync/PlanetScale mint env absent).**

---

## Automated seam → row map

| Captured suite | Result | Rows it partially satisfies |
| --- | --- | --- |
| `tsc --noEmit` mobile / api / auth / db | exit 0 | 1 |
| `pnpm lint` / `lint:fix` | FAIL, 794 errors, pre-existing | 1 (not a #232 regression) |
| `pnpm format:check` | FAIL, 8 pre-existing files | 1 (not a #232 regression) |
| `@trove/auth` `vitest run` | **14/14** `test-auth.txt` | 2 (token/callback contract), 4 (widget page) |
| `@trove/api` focused vitest (8 files) | **97/97** `test-api-workos-seams.txt` | 3, 4, 5, 6, 7 |
| `@trove/api` `pipeline.test.ts` | **18/18** `test-pipeline-viewer-deny.txt` | 4 (viewer), 5 (capability / cross-scope) |
| `@trove/api` deletion + projection | **18/18** `test-deletion-projection.txt` | 6, 7 |
| `@trove/powersync` `pnpm test` (`node --test`) | **9/9** `test-powersync-proper.txt` | 3, 4, 5 |
| `@trove/powersync` via vitest | FAIL runner mismatch `test-powersync.txt` | ignore for product status |
| Ledger-scope `node --test` | **5/5** `test-ledger-scope.txt` | 3, 5 |
| Mobile jest `use-enable-sync`, `use-sync-worker`, manifest, initialize | **19/19** `test-mobile-sync.txt` | 3, 7 (hooks only) |
| Mobile jest ledger-selection / return-to / identity helpers | **17/17** `isolation-helpers-jest-2026-09-12.txt` | 4 (selection encode), 5 (per-user isolation), 7 (sameIdentity) |
| Mobile jest claim-store SecureStore seam | **8/8** `claim-store-jest-2026-09-12.txt` | 5 (claim persistence / stale client seam), 7 (identity switch claim keys) |
| Mobile jest session-probe async | **13/13** `session-probe-jest-2026-09-12.txt` | 7 (`probeSession` / `tryRemoteSignOut` remote seam) |
| Mobile jest `selectLedgerSourceForAccess` local_only offlineReason | **35/35** `ledger-source-offline-jest-2026-09-12.txt` | 6 (client kill_switch / powersync `offline_cached`) |
| Mobile jest memberships `toMembershipSummary` / `roleLabel` | **4/4** `memberships-role-jest-2026-09-12.txt` | 4 (client admin/member/viewer role boundary) |
| `pnpm test:ci` / CI Jest | **PASS** tip stamp | 1 (`ci-stamp-2026-09-12.txt` + prior `test-ci.txt`) |

API focused files in the 97: `powersync/token.test.ts` (4), `personal-budget-recurring.test.ts` (4), `deletion/service.test.ts` (5), `membership/projection.test.ts` (13), `migration/manifest.test.ts` (13), `import-bundle.test.ts` (15), `personal-ledger.test.ts` (18), `households/service.test.ts` (25).

---

## Runtime (stim / agent-device)

| Step | Status | Artifact |
| --- | --- | --- |
| `stim doctor ios` | Ran (stim 1.0.0-rc.21). Notes only — not a product pass. | `stim-doctor-ios.txt` |
| `stim start` | Metro **200** on **8083** | `stim-start.json` / `metro-health-*.txt` |
| `stim ios` | Prior build recovery on branch; **this AuthKit session did not rebuild** (`simctl launch` only). | `stim-ios-*.json` |
| agent-device (iOS AuthKit) | **PARTIAL** — cancel PASS; email + code challenge reached; OTP hard-stopped (AX unavailable). | `authkit-01-launch.png` … `authkit-21-signed-out-final.png`, `authkit-live-write.txt` |
| Client id equality | **EQUAL** (names only) | `client-id-compare.txt` — `WORKOS_CLIENT_ID` == `EXPO_PUBLIC_WORKOS_CLIENT_ID` (EQUAL; values omitted) |
| Post-login protected API | **PASS** (listMine + getManifest) | listMine **200** post-#250; getManifest CF **200** + iPhone 17 Pro UI upload offer (`post-schema-sync-retest.md`, `authkit-102-postschema-upload-offer.png`). **No stim**. Matrix still incomplete. |
| `stim doctor android` / `stim android` / agent-device (Android) | `BLOCKED` / not started | `android-runtime-blocked.md` (prior `stim-doctor-android.txt` harness notes only) |
| Maestro / verify-trove flows | not started | — |

iOS email-code OTP completion, callback, restart, refresh, expiry, network recovery, and Android remain **uncertified**. Do not treat cancel PASS alone as row-2 complete.

---

## Env presence (names only)

### Present locally (`.env.local` / `apps/mobile/.env`)

- `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_CLAIM_TOKEN`, `WORKOS_COOKIE_PASSWORD`
- `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_WORKOS_REDIRECT_URI`
- `EXPO_PUBLIC_SERVER_URL` (`https://auth.trove.ing`)

### Equality checks (no values)

| Check | Result |
| --- | --- |
| `WORKOS_CLIENT_ID` == `EXPO_PUBLIC_WORKOS_CLIENT_ID` | **EQUAL** (`client-id-compare.txt`) — mismatch cleared; does **not** block post-login by itself |

### Present for webhook (names only)

| Name | Notes |
| --- | --- |
| `WORKOS_WEBHOOK_SECRET` | **Present** locally (value omitted). **Prod** Alchemy/env binding is **empty** → live receiver **503** (`workos-webhook-blocked.md`). |

### Absent locally (block the named capability)

| Absent name(s) | Blocks |
| --- | --- |
| `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID` | Local worker mint; live PowerSync removal-bound measure from this machine. |
| `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`) | Local disposable DB reset / mint. |
| `EXPO_PUBLIC_POWERSYNC_URL` | Not required if the client takes the endpoint from the API token response against `auth.trove.ing`. Still not two-device proof. |

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

| File | What it is |
| --- | --- |
| `acceptance-matrix.md` | This matrix. |
| `ci-stamp-2026-09-12.txt` | PR #241 tip CI: Typescript + Jest + EAS SUCCESS; GitGuardian FAILURE noted. |
| `android-runtime-blocked.md` | Android runtime **BLOCKED** / not started (no device). |
| `powersync-disposable-reset-blocked.md` | PowerSync removal + disposable reset **BLOCKED** (env names). |
| `planetscale-schema-ddl-confirm-2026-09-12b.txt` | Second DDL 0011–0015 PlanetScale reconfirm **PASS**. |
| `workos-webhook-probe-2026-09-12b.txt` | Webhook re-probe still **503** (05:47Z). |
| `workos-webhook-probe-2026-09-12d.txt` | Webhook re-probe still **503** (06:30Z); health **200**. |
| `isolation-helpers-jest-2026-09-12.txt` | ledger-selection / return-to / identity Jest **17/17** Relates stamp. |
| `claim-store-jest-2026-09-12.txt` | claim-store SecureStore read/write/clear Jest **8/8** Relates stamp. |
| `membership-revocation-jest-2026-09-12.txt` | plan-membership-revocation + normalizeLedgerSelection Jest Relates stamp (**38/38** with access suite). |
| `session-probe-jest-2026-09-12.txt` | session-probe async `probeSession` / `tryRemoteSignOut` Jest **13/13** Relates stamp. |
| `ledger-source-offline-jest-2026-09-12.txt` | `selectLedgerSourceForAccess` local_only offlineReason Jest **35/35** Relates stamp. |
| `memberships-role-jest-2026-09-12.txt` | memberships `toMembershipSummary` / `roleLabel` Jest **4/4** Relates stamp. |
| `create-account-hittest-status.md` | Create Account hit-test stamp: upload PASS; round-trip BLOCKED; #258 Mac ghosting. |
| `post-pressable-upload-pass.md` | Pressable personal upload **PASS** (tip `fb8c786`). |
| `post-pressable-roundtrip-blocked.md` | One-device round-trip **BLOCKED** (Create Account NativeHost). |
| `create-account-pressable-254-blocked.md` | #254 Pressable Create Account retest **BLOCKED**. |
| `create-account-hittest255-blocked.md` | #255 NativeHost Create Account retest **BLOCKED**. |
| `create-account-fresh-mac-blocked.md` | #256 Metro-confirmed Create Account MISS tip `c9a3ca8`. |
| `api-matrix-non-device.md` | Non-device Relates summary: listMine / getManifest / claim_iss PASS + isolation PARTIAL + blocked rows. |
| `api-isolation-live-2026-09-12.md` | API-only auth-gate + viewer pipeline + schema reconfirm; live dual-identity **BLOCKED**. |
| `live-auth-gate-probe-2026-09-12.txt` | Live curl: missing/forged JWT → **401**; webhook still **503**. |
| `planetscale-schema-ddl-confirm-2026-09-12.txt` | PlanetScale read-only DDL 0011–0015 column reconfirm. |
| `test-pipeline-viewer-deny.txt` | `pipeline.test.ts` **18/18** (viewer capability map). |
| `cf-api-corroboration-2026-09-12.txt` | CF Observability re-query stamp (counts only; no secrets). |
| `ios-otp-ax-blocker.md` | Durable iOS OTP AX **BLOCKER** for owner decision (not a PASS). |
| `workos-webhook-blocked.md` | Prod webhook **BLOCKED** — empty `WORKOS_WEBHOOK_SECRET` → **503**. |
| `workos-webhook-probe-2026-09-12.txt` | Live curl transcript (no secrets). |
| `post-schema-sync-retest.md` | Post-DDL 0011–0015 getManifest **PASS** (CF Worker 200 citations). |
| `revision.txt` | Earlier revision stamp. |
| `authkit-live-write.txt` | This AuthKit write stamp (HEAD, #242 note, OTP hard-stop). |
| `client-id-compare.txt` | `WORKOS_CLIENT_ID` vs `EXPO_PUBLIC_WORKOS_CLIENT_ID` equality result only. |
| `authkit-01-launch.png` … `authkit-21-signed-out-final.png` | iOS AuthKit live screenshots (cancel, email, code challenge, signed-out final). |
| `lint.txt` / `lint-fix.txt` / `format-check.txt` | Pre-existing lint/format failures. |
| `test-auth.txt` | `@trove/auth` 14/14. |
| `test-api-workos-seams.txt` | `@trove/api` focused 97/97. |
| `test-deletion-projection.txt` | deletion + projection 18/18. |
| `test-powersync-proper.txt` | `node --test` 9/9. |
| `test-ledger-scope.txt` | ledger-scope 5/5. |
| `test-mobile-sync.txt` | mobile jest 19/19. |
| `test-ci.txt` | full `pnpm test:ci` pass (prior). |
| `stim-doctor-ios.txt` / `stim-start.json` | harness notes / Metro. |

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
