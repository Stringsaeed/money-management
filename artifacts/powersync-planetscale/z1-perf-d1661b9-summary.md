# Z1 disposable D1 latency at d1661b9

- Head: `d1661b9ffcba65414168251eccc8e6bb8744b1a9`
- Stage: `z1_baseline_d1661b9`, non-production
- Worker: `money-management-server-z1-basu6j62pdcb632c5rdxgadrtsj`
- Storage: disposable D1 `c9bd2159-62e1-4df2-9521-d3672b3bf0c3`
- Probe: 20 warm sequential `transaction.create` calls through public `commands.apply`
- Result: 20/20 HTTP 200, 20/20 `applied`
- Observed ingress: HKG for all 20 requests
- Minimum: 1,921 ms
- Median: 1,991.5 ms
- p90: 2,040 ms
- Maximum: 2,317 ms
- Mean: 2,004.6 ms

Raw samples: `z1-perf-d1661b9.tsv`.
