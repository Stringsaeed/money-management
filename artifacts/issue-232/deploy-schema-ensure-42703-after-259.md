# Deploy Worker failure after #259 — schema-ensure cascade (Relates #232)

**Stamped:** 2026-09-12T19:44Z  
**Cert PR:** #241 (`cursor/workos-certify-migration-b3d1`)  
**Relates:** #232 only (does not close #232 / #224)

## What failed

After [#259](https://github.com/Stringsaeed/money-management/pull/259) merged (WorkOS webhook secret wiring through Deploy Worker), Deploy did **not** die solely on Actions billing. Authoritative run:

- https://github.com/Stringsaeed/money-management/actions/runs/34713619532
- Workflow: Deploy Worker / Alchemy deploy
- Failed step: `Ensure post-cutover schema (0011–0015)`
- Next step `Deploy Worker`: **skipped** → `WORKOS_WEBHOOK_SECRET` never shipped to prod

Twin earlier: https://github.com/Stringsaeed/money-management/actions/runs/34664731498

## Error pattern

1. Many soft-warns: Postgres `42501` `must be owner of table …` while applying 0011–0015.
2. Hard crash (uncaught): `42703` missing columns — latest `visibility`; earlier `ledger_id`.
3. Root: ensure soft-failed only `42501`; cascade undefined-column/table (`42703` / `42P01`) after denied ALTER aborted the step before `buildEnsureResult` could soft-ok.

This is **real schema-ensure SQL failure**, not “billing-only”.

## Soft-fail unblock (agent-fixable deploy gate)

- [#266](https://github.com/Stringsaeed/money-management/pull/266) (`cursor/schema-ensure-soft-fail-8a8f`) — after any `42501` in the run, also soft-fail `42703`/`42P01` so Deploy can proceed.
- Review: ready for review (undrafted 2026-09-12). Local `node --test packages/db/scripts/ensure-post-cutover-schema.test.mjs` → **6/6 pass**. PR checks: Typescript / Jest / EAS Preview / GitGuardian **success**.
- **Do not merge from agents** — owner merges.

## Live webhook (this stamp)

```
POST https://auth.trove.ing/webhooks/workos  →  HTTP 503
Webhook receiver is disabled: WORKOS_WEBHOOK_SECRET is not configured.
```

Agent env: `WORKOS_WEBHOOK_SECRET` **MISSING** (not invented). Live remains **503** until **#266 merges** + Deploy Worker runs successfully with the secret present in Actions/Alchemy env.

## Owner still required (beyond #266)

Soft-fail only unblocks Worker shipping. Sync/create schema completeness still needs table-owner DDL:

- Apply migrations **0011–0015** as PlanetScale **table owner** (or grant owner to deploy role).
- Soft-fail Deploy does **not** create missing `ledger_id` / `visibility` / related objects.

## Governance

- Relates to #232 only — never Closes/Fixes #232 or #224.
- Create Account / NativeButton / #258–#265 parked — out of scope.
