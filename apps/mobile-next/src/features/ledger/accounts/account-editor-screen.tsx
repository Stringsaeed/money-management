import { StyleSheet } from "react-native";

import { useAccountsQuery } from "@/data/ledger-queries";
import { colors, spacing } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { IconButton } from "@/ui/icon-button";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

import { AccountEditorForm } from "./account-editor-form";
import { useAccountEditorActions } from "./use-account-editor-actions";

const FALLBACK_CURRENCY = "USD";

export interface AccountEditorScreenProps {
  /** Account to edit; omit to create a new one. */
  readonly id?: string;
  readonly onDone?: () => void;
}

export function AccountEditorScreen({ id, onDone }: AccountEditorScreenProps) {
  const accounts = useAccountsQuery();
  const account = id ? accounts.data.find((item) => item.id === id) : undefined;
  const actions = useAccountEditorActions(account, onDone);
  // New accounts start in the currency the ledger already uses most visibly.
  const defaultCurrency =
    accounts.data.find((item) => !item.archived)?.currency ?? FALLBACK_CURRENCY;

  if (accounts.isLoading)
    return (
      <Screen>
        <Text style={styles.status}>Loading account…</Text>
      </Screen>
    );
  if (id && !account)
    return (
      <Screen>
        {onDone ? (
          <IconButton name="x" accessibilityLabel="Close" onPress={onDone} style={styles.close} />
        ) : null}
        <EmptyState
          title="Account not found"
          message="This account may have been deleted."
          onRetry={() => void accounts.retry()}
        />
      </Screen>
    );

  return (
    <Screen>
      <AccountEditorForm
        account={account}
        defaultCurrency={defaultCurrency}
        busy={actions.busy}
        error={actions.error}
        onCancel={onDone}
        onSubmit={actions.save}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { color: colors.mutedForeground, padding: spacing[5] },
  close: { margin: spacing[4] },
});
