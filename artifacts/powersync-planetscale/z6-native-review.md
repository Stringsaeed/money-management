# Z6 native PowerSync review receipt

- Date: 2026-09-08
- Code head: `ebe92dc`
- Device: iPhone 17 Pro Max simulator, iOS 26.5
- Dev build: [EAS build `70879488`](https://expo.dev/accounts/stringsaeed/projects/money-management/builds/70879488-bb86-44ff-a957-8d458f133303)
- Backend: disposable non-production Worker stage `z6_review_04a7c08`
- PowerSync instance: Development `6a9e0dd3a77ca1231d260e01`

## Verified flow

1. Signed in with an isolated test profile and household.
2. Enabled Sync from an existing local ledger and matched one account plus 11 categories.
3. Verified `powersync.db` held the automatic membership stream and active `household_ledger`, `household_budget`, and `household_recurring` subscriptions.
4. Applied `budget.configure` and `recurring.change` through the public Worker.
5. Verified the PowerSync database received `Home Essentials` and `Monthly Rent`.
6. Verified the native Envelopes screen rendered the USD workspace and `Home Essentials`.
7. Verified the native Recurring Rules screen rendered active `Monthly Rent` and the Home upcoming section displayed the same rule.

## Runtime defects found and fixed

- The installed pre-existing simulator binary lacked the PowerSync SQLite extension; a current native rebuild loaded `powersync_update_hooks` correctly.
- The published TanStack PowerSync collection adapter targets the PowerSync 1 logger contract while the app uses PowerSync 2. The app now installs a narrow structured-logger compatibility facade, following the approach confirmed on [TanStack DB PR #1688](https://github.com/TanStack/db/pull/1688), and passes the named `powerSyncSchema.props` table copies required by PowerSync 2.
- A transient resolving/revoked access state no longer clears the offline PowerSync database. Only an actual anonymous sign-out clears it.
- The Envelopes tab now mounts the live budget workspace instead of the pre-migration placeholder.

## Media

- [`z6-rules.png`](z6-rules.png)
- [`z6-envelopes.png`](z6-envelopes.png)
- [`Z6-review.mp4`](Z6-review.mp4), 6.2 seconds after static-frame trimming

Result: **pass** for the Z6 native recurring and budget collection lanes.
