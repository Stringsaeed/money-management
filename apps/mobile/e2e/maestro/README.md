# Local Maestro smoke flows

These flows exercise the installed Expo development build on an iOS Simulator.
They assert the intended app behavior, so a broken flow stays red instead of
accepting an error screen or an unsaved form as success.

## Run locally

1. From `apps/mobile`, run `stim start` and `stim ios`. Use the Stim-owned iOS
   Simulator reported by `stim status`; do not target a physical phone.
2. From the repository root, run a flow with the installed Maestro CLI:

   ```sh
   maestro test --udid <SIMULATOR_UDID> apps/mobile/e2e/maestro/anonymous-account-create.yaml
   maestro test --udid <SIMULATOR_UDID> apps/mobile/e2e/maestro/anonymous-category-create.yaml
   maestro test --udid <SIMULATOR_UDID> apps/mobile/e2e/maestro/anonymous-transaction-create.yaml
   ```

Maestro 2.10.0 was used for the initial local run. On another Mac, follow the
[official CLI installation guide](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli).
Do not use Maestro `launchApp.clearState` with this development client: it can
open the Expo launcher instead of Trove. The flows use unique names, so they
do not depend on an empty local ledger. The Transaction flow requires an
existing local Account; run the Account flow once, and close its sheet if it
remains open.

## Coverage and limits

| Flow                                | Expected result                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `anonymous-account-create.yaml`     | Account saves, the Add Account sheet closes, and the row appears.               |
| `anonymous-category-create.yaml`    | Category saves, the Add Category sheet closes, and the row appears.             |
| `anonymous-transaction-create.yaml` | Transaction saves, the form closes, and its unique note appears in the journal. |

The Account and Category FABs currently lack test IDs, so those two flows use
a normalized tap point after asserting the destination screen. This is a
selector limitation, not a substitute for checking the saved row.

WorkOS sign-in, personal sync, and signed-in resource creation require a
controlled staging identity and separate flows. Never commit an email code,
API key, refresh token, or device database to this directory.
