# Cutover D1 to PlanetScale Postgres

- **Status:** Z2 runbook
- **Issue:** #177
- **Freeze:** #173 is still open. Production D1 import waits on that freeze. This runbook uses a PlanetScale development branch.

## Binding

Workers reach PlanetScale through Hyperdrive `HYPERDRIVE_FRESH`. Caching stays disabled. PowerSync (Z3) uses the direct `:5432` host as `powersync_role`, never this Hyperdrive host.

`alchemy.run.ts` keeps production on `trove-ledger-fresh` and gives every non-production stage a stage-suffixed Hyperdrive name. That prevents a verification deploy from retargeting the shared production config. The production name is still a name match, not a pin of id `8e9800a6f0ff4d738ccde750c2120dd1`. `alchemy dev` creates a **local** Hyperdrive from `PLANETSCALE_*` and does not exercise the remote config. `wrangler hyperdrive get 8e9800a6f0ff4d738ccde750c2120dd1` is a separate check.

Do not put `z2-staging` credentials in a prod Alchemy env. That retargets the shared name at the development branch. Do not run `artifacts/powersync-planetscale-spike/smoke.sh --teardown`. That script deletes this Hyperdrive.

Production deploys are fail-closed in both GitHub Actions and `alchemy.run.ts`. They require repository variable `PLANETSCALE_CUTOVER_APPROVED=issue-173-approved`; non-production stages do not. The deploy workflow also requires `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, and `PLANETSCALE_PASSWORD` as Actions secrets. Do not set the approval variable until #173 is closed and the production D1 export plus PlanetScale row-parity receipt are complete.

## Staging first

1. Create a PlanetScale development branch from `trove/main` if one does not exist. Keep `main` write-frozen while #173 is open.
2. Export staging D1 **before** the first Alchemy deploy of this branch. Replacing `Cloudflare.D1.Database` with Hyperdrive deletes the D1 resource from that Alchemy stage. There is no later export.
3. Apply `packages/db/src/migrations/0007_postgres_baseline.sql`, then `packages/db/src/migrations/0008_powersync_row_ids.sql`, in that order on the development branch. Both files must finish. The second migration is idempotent and repairs Z2 branches that recorded the earlier composite-key version of 0007. `CREATE ROLE powersync_role WITH REPLICATION` is swallowed on PlanetScale (`insufficient_privilege`). The publication still lands. Confirm `pg_publication_tables` for `powersync` lists `membership`, `accounts`, `categories`, and `transactions` only. Save receipts for a fresh 0007+0008 apply and an existing legacy-0007 to 0008 upgrade.
4. Create the replication login with `pscale role create trove <branch> powersync_role --inherited-roles postgres --with-replication`. `GRANT SELECT` to the generated `pscale_api_*` name, not `powersync_role`.
5. Point a **local** Hyperdrive at the staging pooled URL (`:6432`) for proof, or keep the remote origin on `main` and write only objects this runbook creates.
6. Record row counts before import and after import.

## Export D1

From the staging Worker account, dump each money table **before** the Hyperdrive deploy:

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
- keeps every published ledger row on a globally unique text `id` primary key
- retains `(household_id, id)` uniqueness on accounts and categories for household-scoped foreign keys

Apply the transformed SQL against the staging branch with `psql` on the direct `:5432` URL. Re-count the same tables. The after counts must match the before counts.

## Flip

1. Deploy `packages/infra/alchemy.run.ts` so the Worker binds `HYPERDRIVE_FRESH` with `caching.disabled = true` and targeted placement `aws:us-east-1` (PlanetScale `trove` region). This step deletes the D1 binding on that stage.
2. Confirm `wrangler hyperdrive get 8e9800a6f0ff4d738ccde750c2120dd1` still shows `"disabled": true` and that its origin host is the branch you intended.
3. Apply one `transaction.create` on staging. The result must be `{ kind: "applied" }` and one new `household_changes` row.
4. Production flip waits on #173. Repeat export, import, count, and deploy against `trove/main` only after that freeze closes. Export prod D1 before that deploy.
5. Set repository variable `PLANETSCALE_CUTOVER_APPROVED=issue-173-approved` only after step 4's export, import, and row-parity checks pass. The value is a durable declaration that this repository has completed the D1-to-PlanetScale cutover; before then, every production deploy stops before Alchemy evaluates resources.

## Rollback

Redeploy the previous Worker **artifact** (the build that still binds D1). Alchemy state after a Hyperdrive deploy no longer has a D1 resource to reattach. PlanetScale data stays. Do not drop `public` ledger tables or the `powersync` publication during rollback.
