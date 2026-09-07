# PowerSync + PlanetScale certification packet

Status: **in progress**. Z0-Z3 infrastructure evidence exists; Z6 code/unit gates pass locally. The publication/stream deployment, Z4-Z6 device review media, Z6 load run, and operator approval are still required before issue #98 can close.

## Stack evidence

| Milestone                      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                             | Status                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Z0 feasibility                 | [`../powersync-planetscale-spike/verdict.md`](../powersync-planetscale-spike/verdict.md), [`../powersync-planetscale-spike/Z0-review-roundtrip.png`](../powersync-planetscale-spike/Z0-review-roundtrip.png), [`../powersync-planetscale-spike/Z0-review-replication.png`](../powersync-planetscale-spike/Z0-review-replication.png), [`../powersync-planetscale-spike/Z0-review.mp4`](../powersync-planetscale-spike/Z0-review.mp4) | complete                                     |
| Z1 op-sqlite                   | [`Z1-review-account.png`](Z1-review-account.png), [`Z1-review-relaunch.png`](Z1-review-relaunch.png), [`Z1-review-android.png`](Z1-review-android.png), [`Z1-review.mp4`](Z1-review.mp4)                                                                                                                                                                                                                                             | complete                                     |
| Z2 PlanetScale + Hyperdrive    | [`z2-worker-apply-verify.txt`](z2-worker-apply-verify.txt), [`z2-hyperdrive.json`](z2-hyperdrive.json), [`z2-publication.txt`](z2-publication.txt), [`z2-vs-z1-perf-8640e41-d1661b9.md`](z2-vs-z1-perf-8640e41-d1661b9.md)                                                                                                                                                                                                           | complete                                     |
| Z3 Sync Streams + auth         | PowerSync Cloud version 5 tenancy/private-isolation run, direct replication p95 272 ms                                                                                                                                                                                                                                                                                                                                               | live result exists; review media pending     |
| Z4 PowerSync collections       | `feat/z4-powersync-collections` local commit `d334c33`                                                                                                                                                                                                                                                                                                                                                                               | unit complete; live review pending           |
| Z5 legacy sync retirement      | `feat/z5-retire-delta-outbox` commit `b16b1e7`                                                                                                                                                                                                                                                                                                                                                                                       | unit complete; live/perf review pending      |
| Z6 all domains + certification | [`load.mjs`](load.mjs), [`../../docs/architecture/powersync-operations.md`](../../docs/architecture/powersync-operations.md)                                                                                                                                                                                                                                                                                                         | implementation and live evidence in progress |

## Required Z6 receipts

- [ ] Full Enable Sync fixture row-count parity.
- [ ] Recurring Rules and Envelopes rendered from PowerSync collections.
- [ ] Three interleaved 50-create load runs, with device-B p95 below 2 seconds and no lost rows.
- [ ] Replication-slot samples showing one active slot and advancing `confirmed_flush_lsn`.
- [ ] Bucket diagnostics below 1,000 per user and no `PSYNC_S2305`.
- [ ] Cache-disabled `HYPERDRIVE_FRESH` receipt.
- [ ] US-region PowerSync receipt or reviewed exception for the current EU development instance.
- [ ] Dry-run deployment receipt listing no D1 binding.
- [ ] Ten Z6 lane artifacts, review screenshots, and review video.
- [ ] Exact-head code review and operator approval.

## Draft issue #98 close comment

> PowerSync + PlanetScale migration certification is complete. The reviewed evidence packet is `artifacts/powersync-planetscale/certification.md`. It links the Z0-Z6 feasibility, tenancy, private-account, migration, no-D1, load, replication-lag, bucket-count, device, and performance receipts. The final stack was landed by the operator after exact-head review.

Do not post this comment or close #98 until every receipt above is checked and the operator approves it.
