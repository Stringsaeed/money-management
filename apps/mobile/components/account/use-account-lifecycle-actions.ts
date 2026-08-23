import { useState } from "react";
import { Alert } from "react-native";

import {
  useAccountArchivalPreview,
  useAccountDeletionPreview,
  useArchiveAccount,
  useDeleteAccount,
  useRestoreAccount,
} from "@/hooks/use-accounts";
import type { AccountWithBalance } from "@/types";

export function useAccountLifecycleActions(account: AccountWithBalance, onCompleted: VoidFunction) {
  const [error, setError] = useState("");
  const archiveAccount = useArchiveAccount();
  const deleteAccount = useDeleteAccount();
  const restoreAccount = useRestoreAccount();
  const archivalPreview = useAccountArchivalPreview(account.id);
  const deletionPreview = useAccountDeletionPreview(account.id);

  function confirmArchive() {
    Alert.alert(
      `Archive ${account.name}?`,
      "This keeps ledger and budget history, removes the Account from current and future Funding Pools, and never restores Funding Membership automatically.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: async () => {
            try {
              setError("");
              await archiveAccount.mutateAsync(account.id);
              onCompleted();
            } catch (cause) {
              console.error("Account archival failed", {
                accountId: account.id,
                errorName: cause instanceof Error ? cause.name : "UnknownError",
              });
              setError("The Account was not archived. Review every prerequisite and try again.");
            }
          },
        },
      ],
    );
  }

  function confirmRestore() {
    Alert.alert(
      `Restore ${account.name}?`,
      "This makes the Account selectable again. Funding Membership stays off until you explicitly add it to a Funding Pool.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              setError("");
              await restoreAccount.mutateAsync(account.id);
              onCompleted();
            } catch (cause) {
              console.error("Account restoration failed", {
                accountId: account.id,
                errorName: cause instanceof Error ? cause.name : "UnknownError",
              });
              setError("The Account was not restored. Please try again.");
            }
          },
        },
      ],
    );
  }

  function confirmPermanentDelete() {
    Alert.alert(
      `Permanently delete ${account.name}?`,
      "This unused Account has no ledger, Recurring Rule, or budget history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            try {
              setError("");
              await deleteAccount.mutateAsync(account.id);
              onCompleted();
            } catch (cause) {
              console.error("Account deletion failed", {
                accountId: account.id,
                errorName: cause instanceof Error ? cause.name : "UnknownError",
              });
              setError("The Account was not deleted. Please try again.");
            }
          },
        },
      ],
    );
  }

  return {
    archivalPreview,
    confirmArchive,
    confirmPermanentDelete,
    confirmRestore,
    deletionPreview,
    error,
  };
}
