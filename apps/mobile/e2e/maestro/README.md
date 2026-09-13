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

From the repository root, pass the expected profile control and a harmless
label for the unique generated names:

```sh
maestro test --udid <SIMULATOR_UDID> \
  -e EXPECTED_PROFILE_ID=profile-sign-in \
  -e RUN_LABEL=local \
  apps/mobile/e2e/maestro/resource-creation.yaml
```

After the separate authentication and personal-sync flow completes, invoke the
same file again with the signed-in selector:

```sh
maestro test --udid <SIMULATOR_UDID> \
  -e EXPECTED_PROFILE_ID=profile-sign-out \
  -e RUN_LABEL=personal \
  apps/mobile/e2e/maestro/resource-creation.yaml
```

`RUN_LABEL` is only a visible prefix. Each resource appends the current time,
so repeated runs do not rely on an empty ledger or duplicate a fixed name.
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
  apps/mobile/e2e/maestro/account-create.yaml

maestro test --udid <SIMULATOR_UDID> \
  -e EXPECTED_PROFILE_ID=profile-sign-in \
  -e RUN_LABEL=local-category \
  apps/mobile/e2e/maestro/category-create.yaml

maestro test --udid <SIMULATOR_UDID> \
  -e EXPECTED_PROFILE_ID=profile-sign-in \
  -e RUN_LABEL=local-transaction \
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

The existing local evidence intentionally has red Account and Category
sheet-close assertions after their rows save, while Transaction is green. Keep
those checks hard and visible. Do not mark a resource optional or remove the
close assertion just to make the sweep green.

Maestro 2.10.0 was used for the initial local run. On another Mac, follow the
[official CLI installation guide](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli).
