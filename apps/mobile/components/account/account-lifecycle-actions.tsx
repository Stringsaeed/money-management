import type { Href } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import type { AccountWithBalance } from "@/types";

import { AccountArchiveBlockers } from "./account-archive-blockers";
import { useAccountLifecycleActions } from "./use-account-lifecycle-actions";

interface AccountLifecycleActionsProps {
  account: AccountWithBalance;
  onCompleted: VoidFunction;
  onReview: (href: Href) => void;
}

export function AccountLifecycleActions({
  account,
  onCompleted,
  onReview,
}: AccountLifecycleActionsProps) {
  const actions = useAccountLifecycleActions(account, onCompleted);
  const synced = actions.archivalPreview.source === "synced";
  const blockers = actions.archivalPreview.data?.blockers ?? [];
  const previewFailed =
    !synced && (actions.archivalPreview.isError || actions.deletionPreview.isError);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Account lifecycle</Text>
      {account.lifecycle === "archived" ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={layoutTransition}
          style={styles.actionsGroup}
        >
          <Text style={styles.infoText}>
            Archived Accounts keep their history but cannot receive new activity or fund a budget.
          </Text>
          {synced ? null : (
            <Button
              aria-label={`Restore ${account.name}`}
              onPress={actions.confirmRestore}
              size="lg"
              variant="secondary"
            >
              <Text>Restore Account</Text>
            </Button>
          )}
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={layoutTransition}
          style={styles.actionsGroup}
        >
          {blockers.length > 0 ? (
            <AccountArchiveBlockers account={account} blockers={blockers} onReview={onReview} />
          ) : null}
          <Button
            aria-label={`Archive ${account.name}`}
            disabled={!synced && !actions.archivalPreview.data?.canArchive}
            onPress={actions.confirmArchive}
            size="lg"
            variant="outline"
          >
            <Text>Archive Account</Text>
          </Button>
          {synced ? null : actions.deletionPreview.data?.canDelete ? (
            <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
              <Button
                aria-label={`Permanently delete ${account.name}`}
                onPress={actions.confirmPermanentDelete}
                size="lg"
                variant="destructive"
              >
                <Text>Delete Permanently</Text>
              </Button>
            </Animated.View>
          ) : actions.deletionPreview.isSuccess ? (
            <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
              <Text style={styles.hintText}>
                Financial history found. Archive this Account after resolving its prerequisites.
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      )}
      {previewFailed ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
          <Text role="alert" style={styles.errorText}>
            Account dependencies could not be refreshed. Retry before changing its lifecycle.
          </Text>
        </Animated.View>
      ) : null}
      {actions.error ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
          <Text role="alert" style={styles.errorText}>
            {actions.error}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ledgerOutline,
    paddingTop: spacing[5],
  },
  heading: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textLg,
    fontStyle: "italic",
    color: colors.ink,
  },
  actionsGroup: {
    gap: spacing[3],
  },
  infoText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
  hintText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
  errorText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.destructive,
  },
});
