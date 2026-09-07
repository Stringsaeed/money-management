# Z1 corrected performance proof

- Trunk SHA: `ab06965a428cede85ade62cf3bf5eae3298929d9`
- Head SHA: `a0006271c12653f2fd8277bd3ec22f0c8a4882f5`
- Simulator: iPhone 17 `D1509E32-FDCD-4788-93A3-DB775B256CFA`, iOS 26.5
- Runs: five trunk/head alternations after one unmeasured warmup per lane

## Method

- Installed the existing trunk/head dev-client apps alternately without uninstalling, preserving one local data container on the same simulator.
- Started trunk Metro on `8082` and head Metro on `8081` with `EXPO_PUBLIC_Z1_PERF=1`.
- Cold launch began immediately before the dev-client deep link opened a terminated app. Home-ready time is the first exact `Z1_PERF_HOME_READY` client event emitted by the Home root layout.
- Each insert sample used Settings > Run Seed Data. Temporary uncommitted instrumentation in `db/seed.ts` deleted fixed prior perf rows outside the timer, then timed one committed Drizzle transaction containing 100 sequential local transaction inserts. No host `sqlite3` writes were used.
- Argent confirmed `Create transaction` after each launch and the seed completion alert after every timed insert.
- One head run-2 seed tap was swallowed during the Settings transition. No measurement was emitted. The button was rediscovered after an idle wait, tapped once, and the resulting first timing was retained as `pass-after-idle-retry`.

## Results

| Metric | Trunk median | Head median | Head change | Rule | Result |
| --- | ---: | ---: | ---: | --- | --- |
| Cold launch to Home | 6,897 ms | 6,579 ms | 4.61% faster | within 15% of trunk | PASS |
| Commit 100 local transaction inserts | 78.701 ms | 71.409 ms | 9.26% faster | at or under trunk | PASS |

Raw receipts:

- `z1-perf-corrected-launch.tsv`
- `z1-perf-corrected-insert.tsv`

The prior timeout-based and host-SQLite measurements are superseded by this proof.
