# Local Maestro resource flows

These flows exercise the installed Expo development build on an iOS Simulator.
`resource-creation.yaml` is the one reusable Account, Category, and Transaction
sweep. Run the same file before authentication and again after the separate
authentication flow has established personal sync. The resource flows do not
own authentication or sync setup.

## Preconditions

1. From `apps/mobile`, start the Stim services and Expo development client:

   ```sh
   stim start
   stim ios
   ```

2. Use the Stim-owned iOS Simulator reported by `stim status`. Do not target a
   physical phone.
3. Do not use Maestro `launchApp.clearState` with this development client. It
   can open the Expo launcher instead of Trove, and these flows intentionally
   keep existing ledger data.
4. Before the anonymous run, sign out and leave the app usable from Home. The
   flow proves the signed-out state with `profile-sign-in` before creating data.
5. Before the personal run, complete the separate authentication flow and wait
   for personal sync to settle. The same resource flow proves the signed-in
   state with `profile-sign-out` before creating data.
6. Transaction creation requires an Account in the selected ledger. The sweep
   creates an Account first; when diagnosing Transaction alone, run the
   Account flow first or use a ledger that already has one.

## Run the reusable sweep

From the repository root, choose one numeric run ID and reuse it for the local
and personal passes. The same ID identifies exact rows in the read-only cloud
checks:

```sh
RUN_ID=$(node -p 'Date.now()')
maestro test --udid <SIMULATOR_UDID> \
  -e EXPECTED_PROFILE_ID=profile-sign-in \
  -e RUN_LABEL=local \
  -e RUN_ID="$RUN_ID" \
  apps/mobile/e2e/maestro/resource-creation.yaml
```

After the separate authentication and personal-sync flow completes, invoke the
same file again with the signed-in selector:

```sh
maestro test --udid <SIMULATOR_UDID> \
  -e EXPECTED_PROFILE_ID=profile-sign-out \
  -e RUN_LABEL=personal \
  -e RUN_ID="$RUN_ID" \
  apps/mobile/e2e/maestro/resource-creation.yaml
```

`RUN_LABEL` identifies the phase; `RUN_ID` makes its records unique. The same
`open-trove-link.yaml` helper accepts the iOS first-use deep-link confirmation
on a fresh simulator.
Never put an email code, API key, refresh token, or device database in this
directory.

## Diagnose resources independently

The sweep is intentionally sequential. A red Account or Category sheet-close
assertion stops the sweep, so a later Transaction result cannot be inferred
from that run. Run the affected resource files separately to obtain an honest
per-resource result, using the same mode arguments:

```sh
maestro test --udid <SIMULATOR_UDID> \
  -e EXPECTED_PROFILE_ID=profile-sign-in \
  -e RUN_LABEL=local-account \
  -e RUN_ID="$RUN_ID" \
  apps/mobile/e2e/maestro/account-create.yaml

maestro test --udid <SIMULATOR_UDID> \
  -e EXPECTED_PROFILE_ID=profile-sign-in \
  -e RUN_LABEL=local-category \
  -e RUN_ID="$RUN_ID" \
  apps/mobile/e2e/maestro/category-create.yaml

maestro test --udid <SIMULATOR_UDID> \
  -e EXPECTED_PROFILE_ID=profile-sign-in \
  -e RUN_LABEL=local-transaction \
  -e RUN_ID="$RUN_ID" \
  apps/mobile/e2e/maestro/transaction-create.yaml
```

Use `profile-sign-out` and a `personal-*` label for the corresponding
post-auth diagnosis. Each file launches the app independently, so a failed
sheet-close assertion does not hide the next resource's result.

## Coverage and known limits

| Flow                        | Expected result                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `account-create.yaml`       | Account saves, the Add Account sheet closes, and the unique row appears.                |
| `category-create.yaml`      | Category saves, the Add Category sheet closes, and the unique row appears.              |
| `transaction-create.yaml`   | Transaction saves, the form closes, and the unique note appears in the journal.         |
| `home-journal-visible.yaml` | A previously saved personal Transaction appears on Home after a fresh signed-in launch. |

The Account and Category FABs currently lack test IDs, so those flows use a
normalized tap point after asserting the destination screen. This is a selector
limitation, not a substitute for checking the saved row. The Transaction flow
keeps its distinct amount, note, save, form-close, and journal assertions.
It uses Maestro's internal clipboard to paste the note and asserts the exact
text before saving; iOS keyboard entry once dropped a character without
failing `inputText`.

The initial main build had red Account and Category sheet-close assertions
after their rows saved. The sheet fix has since been merged, and the complete
anonymous sweep passed against its simulator build. Keep those checks hard
and visible; do not make a resource optional merely to turn the suite green.

## Hosted sign-in and cloud evidence

`auth.yaml` uses the real hosted WorkOS email-code path through the local
`scripts/maestro-workos-auth.js` runner. The runner keeps the WorkOS API key
outside Maestro and its debug output. An iOS simulator run signed in with the
approved Gmail plus alias: the runner retrieved the matching WorkOS Staging
Email Code from the event API and no one opened the inbox. The six AuthKit
code boxes require separate digit input; a single `inputText` dropped digits
in the first live run. The base Gmail address remains forbidden by the runner.

After sign-in, `personal-sync.yaml` asserts the app's signed-in personal-sync
path. A first upload requires `UPLOAD_CHOICE=confirm`; omitting it must not
silently upload local data. Do not substitute Household sync for this step.

`scripts/maestro-verify-cloud.mjs` performs read-only PlanetScale checks for
the exact run labels before authentication and for the authenticated personal
ledger afterward. Its post-auth check requires the WorkOS user ID, verifies
the labels belong to that personal ledger, and rejects duplicate or
out-of-scope rows. A database hit proves the upload reached PlanetScale; it
does **not** independently prove PowerSync downloaded the same rows. The
approved first upload reached PlanetScale and the Production personal stream
downloaded its rows to the simulator. On a later run, the anonymous sweep
passed and its exact Account, Category, and Transaction labels remained absent
from PlanetScale after sign-in. Hosted AuthKit sign-in passed again; the
authenticated sweep then passed all three resource flows. PlanetScale held
exactly one of each new label in the same Personal Ledger, and the signed-in
Transaction returned to PowerSync with an empty upload queue. The read-only
Home regression was red on fresh signed-in launches, then passed twice after
the transaction hook's targeted React Compiler opt-out. Issue #277 tracks a
longer-term immutable-snapshot replacement for that opt-out.

Keep WorkOS and database credentials in separate operator-held local env
files, outside the repository. Load each file into only the Node process that
needs it; do not export either secret into the shell that runs plain `maestro`
commands. The WorkOS file defines `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`,
`WORKOS_TEST_EMAIL` (the approved dedicated plus alias), and
`WORKOS_TARGET=staging`. The database file defines either `DATABASE_URL` or
the `PLANETSCALE_*` connection values. Neither file is committed.

For one test run, use the same `RUN_ID` and simulator in this order:

1. Run the anonymous resource sweep above with `RUN_LABEL=local`.
2. Assert the local labels are absent from PlanetScale:

   ```sh
   RUN_ID="$RUN_ID" RUN_LABEL=local node --env-file="$DB_TEST_ENV_FILE" \
     scripts/maestro-verify-cloud.mjs --phase pre-auth
   ```

3. Run the hosted auth flow without a human inbox. The output path must not
   exist yet; the runner creates it with owner-only permissions:

   ```sh
   QA_RUN_DIR=$(mktemp -d)
   RUN_ID="$RUN_ID" WORKOS_USER_ID_OUTPUT="$QA_RUN_DIR/user-id" \
     node --env-file="$WORKOS_TEST_ENV_FILE" scripts/maestro-workos-auth.js \
     --udid "$SIMULATOR_UDID" apps/mobile/e2e/maestro/auth.yaml
   ```

4. For an empty personal cloud, run `personal-sync.yaml` with
   `UPLOAD_CHOICE=confirm` only when this run is authorized to upload its local
   QA records. For an already populated personal cloud, use Profile's
   `Sync just for me` path and verify `Your personal ledger syncs`; do not run
   the first-upload flow or merge anonymous rows. Then run the same resource
   sweep with `RUN_LABEL=personal` and `EXPECTED_PROFILE_ID=profile-sign-out`.
5. Verify the signed-in resource labels belong to the authenticated personal
   ledger. The user ID comes from the runner output file, not a manual WorkOS
   lookup:

   ```sh
   RUN_ID="$RUN_ID" RUN_LABEL=personal \
     PERSONAL_USER_ID="$(< "$QA_RUN_DIR/user-id")" \
     node --env-file="$DB_TEST_ENV_FILE" \
     scripts/maestro-verify-cloud.mjs --phase post-auth
   ```

This is a manual local sequence today, not a scheduled production test. The
runner does not create a WorkOS User; provision the dedicated Staging User
once if needed. Personal sync can upload QA ledger data, so review the target
before confirming it.

Maestro 2.10.0 was used for the initial local run. On another Mac, follow the
[official CLI installation guide](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli).
