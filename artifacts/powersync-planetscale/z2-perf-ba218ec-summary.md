# Z2 request latency at ba218ec

- Head: `ba218ecd31e8c0b9313af345ff140c233e8c7aa9`
- Target: PlanetScale `z2-staging`, `production=false`
- Worker: local Alchemy stage `z2_ba218ec` at `http://127.0.0.1:3001`
- Probe: 20 sequential `transaction.create` calls through the public `commands.apply` RPC
- Result: 20/20 HTTP 200, 20/20 `applied`
- Minimum: 6,176 ms
- Median: 6,333.5 ms
- p90: 6,484 ms
- Maximum: 6,526 ms
- Mean: 6,323.9 ms

Raw samples: `z2-perf-ba218ec.tsv`.

This is an honest local-stage latency miss against the Z2 target. It is not a pinned-region Worker measurement and has no trunk D1 baseline.
