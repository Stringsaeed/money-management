# Production D1 to PlanetScale cutover receipt

- Date: 2026-09-08
- Source D1: `money-management-database-prod-otf3fnzgw5r4j2m4`
- Source D1 ID: `2e0fddb7-fb8e-40cd-86b2-aa7caa800ec3`
- Freeze workflow: [GitHub Actions run `34163010628`](https://github.com/Stringsaeed/money-management/actions/runs/34163010628)
- Deployed `KILL_SWITCH_LOCAL_ONLY`: `on`
- Target: PlanetScale `trove/main`, AWS `us-east-1`
- Protected PlanetScale backup: `l8nnel7yuzyg`, `pre-d1-cutover-20260908`
- SQL export SHA-256: `6b23764e2cf0d9c1ee1422cf70d127778d6c355d2c6abb511133fbe6691894b5`
- Restored SQLite SHA-256: `f3e7407177faaaf1951791d75e642f2bb33f498dc5f243f598361f293f95e210`

The raw D1 SQL export and restored SQLite database remain outside Git with mode `0600`. The SQL checksum verifies and the restored copy returns `ok` from `PRAGMA integrity_check`.

## Dry run

The importer applied migrations `0007` through `0010` to disposable branch `d1-cutover-dry-run`, replaced its application rows, and passed twice. Both runs matched the frozen source by row count and per-table SHA-256 digest. The dry-run branch and its temporary credential were deleted afterward.

Structural checks passed with:

- 13 expected tables in publication `powersync`;
- zero unvalidated constraints;
- zero Account, Transaction, or Membership foreign-key orphans;
- zero household change-sequence mismatches.

## Production import

The production operation took an advisory cutover lock, truncated the application tables, imported the frozen D1 snapshot in foreign-key order, rebuilt `household_change_sequences`, and committed as one Postgres transaction.

| Table               | Frozen D1 | PlanetScale after |
| ------------------- | --------: | ----------------: |
| `user`              |         3 |                 3 |
| `session`           |         3 |                 3 |
| `account`           |         1 |                 1 |
| `household`         |         1 |                 1 |
| `membership`        |         1 |                 1 |
| `accounts`          |         4 |                 4 |
| `categories`        |        12 |                12 |
| `transactions`      |        11 |                11 |
| `household_changes` |        20 |                20 |
| `command_results`   |        20 |                20 |

Every other imported budget, recurring, invite, verification, refund, assignment, occurrence, and projection-cache table had zero rows on both sides. [`production-d1-import.json`](production-d1-import.json) contains the complete safe count and digest receipt without row contents.

After commit, the source D1 counts remained unchanged, all target constraints and foreign keys passed, the publication still contained exactly 13 tables, and the sole PowerSync slot was active with zero lag bytes.

Result: **pass**. Keep the kill switch on until the Hyperdrive Worker, PowerSync auth/config, and signed-in smoke test pass.
