import type { V2Account } from "@trove/api/v2/contracts";

import type { AccountInput } from "@/data/ledger-client";
import { useLedgerMutationsWithSound } from "@/features/sound";

import { useEditorSubmit } from "../editor/use-editor-submit";

export function useAccountEditorActions(account: V2Account | undefined, onDone?: () => void) {
  const mutations = useLedgerMutationsWithSound();
  const { busy, error, run } = useEditorSubmit(onDone);

  const save = (input: AccountInput) =>
    run(
      () =>
        account
          ? mutations.updateAccount(account.id, input, account.version)
          : mutations.createAccount(input),
      "Couldn't save this account. Check your connection and try again.",
    );

  return { busy, error, save };
}
