import { Alert } from "react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { useLedgerMutationsWithSound } from "@/features/sound";

import { useEditorSubmit } from "../editor/use-editor-submit";

export function useTransactionActions(transaction: V2Transaction | undefined, onDone?: () => void) {
  const mutations = useLedgerMutationsWithSound();
  const { busy, error, run } = useEditorSubmit(onDone);

  const save = (input: TransactionInput) =>
    run(async () => {
      if (transaction)
        await mutations.updateTransaction(transaction.id, input, transaction.version);
      else await mutations.createTransaction(input);
    }, "Couldn't save this transaction. Check your connection and try again.");

  const confirmDelete = (target: V2Transaction) =>
    Alert.alert("Delete transaction?", "This removes the entry and updates your account balance.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          void run(
            () => mutations.deleteTransaction(target.id, target.version),
            "Could not delete the transaction. Try again.",
          ),
      },
    ]);

  return {
    busy,
    error,
    save,
    confirmDelete: transaction ? () => confirmDelete(transaction) : undefined,
  };
}
