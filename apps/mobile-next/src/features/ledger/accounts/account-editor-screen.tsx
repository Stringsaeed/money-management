import { StyleSheet, View } from "react-native";

import { useAccountsQuery } from "@/data/ledger-queries";
import { EmptyState, Header, layout, Screen, Skeleton, space } from "@/ui/trove";

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
        <View accessibilityState={{ busy: true }} style={styles.status}>
          <Skeleton height={32} width="60%" />
          <Skeleton height={96} />
        </View>
      </Screen>
    );
  if (id && !account)
    return (
      <Screen>
        <View style={styles.status}>
          <Header variant="compact" title="Account" onBack={onDone} />
          <EmptyState
            title="Account not found"
            message="This account may have been deleted."
            icon="info"
            actionLabel="Try again"
            onAction={() => void accounts.retry()}
          />
        </View>
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
  status: { gap: space[4], padding: layout.screenGutter },
});
