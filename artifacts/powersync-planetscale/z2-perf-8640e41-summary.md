# Z2 disposable Worker latency at 8640e41

- Head: `8640e41398a3bbc5edc3c0708017d4986dba15d0`
- Stage: `z2_verify_8640e41`, non-production
- Worker: `money-management-server-z2-verqilo6ovhbkbjppve6bu7ocdm`
- Placement: targeted `aws:us-east-1`
- Hyperdrive: stage-suffixed, cache disabled, PlanetScale `z2-staging`
- Probe: 20 warm sequential `transaction.create` calls through public `commands.apply`
- Result: 20/20 HTTP 200, 20/20 `applied`
- Observed ingress: NRT for all 20 requests
- Minimum: 470 ms
- Median: 554.5 ms
- p90: 620 ms
- Maximum: 720 ms
- Mean: 560.0 ms

Raw samples: `z2-perf-8640e41.tsv`.

The p90 passes the Z2 absolute rule of less than 1 second. The median is above the alternative absolute threshold of 500 ms, and no trunk D1 baseline was exercised because production/D1 access was explicitly out of scope.
