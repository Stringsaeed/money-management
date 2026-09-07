# Cutover D1 to PlanetScale Postgres

- **Status:** Z2 runbook
- **Issue:** #177
- **Freeze:** #173 is still open. Production D1 import waits on that freeze. This runbook uses a PlanetScale development branch and the existing cache-disabled Hyperdrive `trove-ledger-fresh` (`8e9800a6f0ff4d738ccde750c2120dd1`).

## Binding

Workers reach PlanetScale through Hyperdrive `HYPERDRIVE_FRESH`. Caching stays disabled. PowerSync (Z3) uses the direct `:5432` host as `powersync_role`, never this Hyperdrive host.

Reuse the Z0 config. Do not create a second fresh Hyperdrive unless `wrangler hyperdrive get 8e9800a6f0ff4d738ccde750c2120dd1` fails. Do not run `artifacts/powersync-planetscale-spike/smoke.sh --teardown`. That script deletes this Hyperdrive.

## Staging first

1. Create a PlanetScale development branch from `trove/main` if one does not exist. Keep `main` write-frozen while #173 is open.
2. Apply `packages/db/src/migrations/0007_postgres_baseline.sql` on that branch. Confirm `\dRp+ powersync` lists `membership`, `accounts`, `categories`, and `transactions` only.
3. Point Hyperdrive origin at the staging branch pooled URL (`:6432`) for the proof, or keep the existing origin and write only to objects this runbook creates.
4. Record row counts before import and after import.

## Export D1

From the staging Worker account, dump each money table:

```
npx wrangler d1 export database --remote --output artifacts/powersync-planetscale/z2-d1-export.sql
```

Count rows for `user`, `session`, `account`, `verification`, `household`, `membership`, `invite_code`, `accounts`, `categories`, `transactions`, `household_changes`, `command_results`, plus budget and recurring tables that exist in the dump. Save the counts in `artifacts/powersync-planetscale/z2-row-counts.md`.

## Import PlanetScale

Load the dump through a transform that:

- maps SQLite integer timestamps to `timestamptz`
- maps `0`/`1` integer booleans to `boolean`
- maps JSON text columns to `jsonb`
- keeps every `id` as text
- keeps composite ledger keys `(household_id, id)`

Apply the transformed SQL against the staging branch with `psql` on the direct `:5432` URL. Re-count the same tables. The after counts must match the before counts.

## Flip

1. Deploy `packages/infra/alchemy.run.ts` so the Worker binds `HYPERDRIVE_FRESH` with `caching.disabled = true` and targeted placement `aws:us-east-1` (PlanetScale `trove` region).
2. Confirm `wrangler hyperdrive get 8e9800a6f0ff4d738ccde750c2120dd1` still shows `"disabled": true`.
3. Apply one `transaction.create` on staging. The result must be `{ kind: "applied" }` and one new `household_changes` row.
4. Production flip waits on #173. Repeat export, import, count, and deploy against `trove/main` only after that freeze closes.

## Rollback

Restore the previous Worker deploy that still binds D1. PlanetScale data stays. Do not drop `public` ledger tables or the `powersync` publication during rollback.
