import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import {
  useAccountArchivalPreview,
  useAccountDeletionPreview,
  useArchiveAccount,
  useDeleteAccount,
  useRestoreAccount,
} from "@/hooks/use-accounts";
import type { AccountWithBalance } from "@/types";

interface AccountLifecycleActionsProps {
  account: AccountWithBalance;
  onCompleted: VoidFunction;
}

export function AccountLifecycleActions({ account, onCompleted }: AccountLifecycleActionsProps) {
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
            } catch {
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
            } catch {
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
            } catch {
              setError("The Account was not deleted. Please try again.");
            }
          },
        },
      ],
    );
  }

  const blockers = archivalPreview.data?.blockers ?? [];

  return (
    <View className="gap-3 border-t border-ledger-outline pt-5">
      <Text className="font-heading-normal text-lg italic text-ink">Account lifecycle</Text>
      {account.lifecycle === "archived" ? (
        <>
          <Text className="font-body-normal text-sm text-ink/60">
            Archived Accounts keep their history but cannot receive new activity or fund a budget.
          </Text>
          <Button
            aria-label={`Restore ${account.name}`}
            onPress={confirmRestore}
            size="lg"
            variant="secondary"
          >
            <Text>Restore Account</Text>
          </Button>
        </>
      ) : (
        <>
          {blockers.length > 0 ? (
            <Animated.View
              className="gap-3 rounded-xl border border-terracotta/30 bg-terracotta/10 p-4"
              entering={FadeIn}
              exiting={FadeOut}
              layout={layoutTransition}
            >
              <Text role="alert" className="font-body-semibold text-sm text-terracotta">
                Resolve every prerequisite before archiving
              </Text>
              {blockers.map((blocker) =>
                blocker.kind === "non-zero-balance" ? (
                  <View className="gap-2" key={blocker.kind}>
                    <Text className="font-body-normal text-sm text-ink/70">
                      Balance must be zero. Current balance:{" "}
                      <MoneyText
                        cents={Math.abs(blocker.balanceMinor)}
                        currency={account.currency}
                        sign={blocker.balanceMinor < 0 ? "-" : ""}
                      />
                    </Text>
                    <Text className="font-body-normal text-xs text-ink/50">
                      {blocker.recoveryAction}
                    </Text>
                    <Button
                      aria-label={`Review ${account.name} balance`}
                      onPress={() => router.push("/(tabs)/ledger")}
                      size="lg"
                      variant="outline"
                    >
                      <Text>Review Balance</Text>
                    </Button>
                  </View>
                ) : (
                  <View className="gap-2" key={blocker.kind}>
                    <Text className="font-body-normal text-sm text-ink/70">
                      Active Recurring Rules: {blocker.rules.map((rule) => rule.name).join(", ")}
                    </Text>
                    <Text className="font-body-normal text-xs text-ink/50">
                      {blocker.recoveryAction}
                    </Text>
                    <Button
                      aria-label="Review blocking Recurring Rules"
                      onPress={() => router.push("/recurring")}
                      size="lg"
                      variant="outline"
                    >
                      <Text>Review Recurring Rules</Text>
                    </Button>
                  </View>
                ),
              )}
            </Animated.View>
          ) : null}
          <Button
            aria-label={`Archive ${account.name}`}
            disabled={!archivalPreview.data?.canArchive}
            onPress={confirmArchive}
            size="lg"
            variant="outline"
          >
            <Text>Archive Account</Text>
          </Button>
          {deletionPreview.data?.canDelete ? (
            <Button
              aria-label={`Permanently delete ${account.name}`}
              onPress={confirmPermanentDelete}
              size="lg"
              variant="destructive"
            >
              <Text>Delete Permanently</Text>
            </Button>
          ) : deletionPreview.isSuccess ? (
            <Text className="font-body-normal text-sm text-ink/50">
              Financial history found. Archive this Account after resolving its prerequisites.
            </Text>
          ) : null}
        </>
      )}
      {archivalPreview.isError || deletionPreview.isError ? (
        <Text role="alert" className="font-body-medium text-sm text-destructive">
          Account dependencies could not be refreshed. Retry before changing its lifecycle.
        </Text>
      ) : null}
      {error ? (
        <Text role="alert" className="font-body-medium text-sm text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
