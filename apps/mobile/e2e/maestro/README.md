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

| Flow                      | Expected result                                                                 |
| ------------------------- | ------------------------------------------------------------------------------- |
| `account-create.yaml`     | Account saves, the Add Account sheet closes, and the unique row appears.        |
| `category-create.yaml`    | Category saves, the Add Category sheet closes, and the unique row appears.      |
| `transaction-create.yaml` | Transaction saves, the form closes, and the unique note appears in the journal. |

The Account and Category FABs currently lack test IDs, so those flows use a
normalized tap point after asserting the destination screen. This is a selector
limitation, not a substitute for checking the saved row. The Transaction flow
keeps its distinct amount, note, save, form-close, and journal assertions.

The initial main build had red Account and Category sheet-close assertions
after their rows saved. The sheet fix has since been merged, and the complete
anonymous sweep passed against its simulator build. Keep those checks hard
and visible; do not make a resource optional merely to turn the suite green.

## Hosted sign-in and cloud evidence

`auth.yaml` uses the real hosted WorkOS email-code path through the local
`scripts/maestro-workos-auth.js` runner. The runner keeps the WorkOS API key
outside Maestro and its debug output. It is not a mock login and it has not
yet been run against the hosted service, so its selectors remain unverified.
Use a dedicated test identity, never a person's inbox or a production user.

After sign-in, `personal-sync.yaml` asserts the app's signed-in personal-sync
path. A first upload requires `UPLOAD_CHOICE=confirm`; omitting it must not
silently upload local data. Do not substitute Household sync for this step.

`scripts/maestro-verify-cloud.mjs` performs read-only PlanetScale checks for
the exact run labels before authentication and for the authenticated personal
ledger afterward. Its post-auth check requires the WorkOS user ID, verifies
the labels belong to that personal ledger, and rejects duplicate or
out-of-scope rows. A database hit proves the upload reached PlanetScale; it
does **not** independently prove PowerSync downloaded the same rows. Do not
report the full sync path as passing until a hosted run and PowerSync download
check have both succeeded.

Maestro 2.10.0 was used for the initial local run. On another Mac, follow the
[official CLI installation guide](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli).
