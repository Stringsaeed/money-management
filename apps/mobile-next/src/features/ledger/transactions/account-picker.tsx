import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { EmptyState, OptionTile, Sheet, space } from "@/ui/trove";

import { accountTypeOption } from "../accounts/account-display";

import { afterSheetCloses } from "./transaction-create-actions";
import { accountTileSubtitle } from "./transaction-display";

interface AccountPickerProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
  readonly title: string;
  readonly accounts: readonly V2Account[];
  readonly selectedId: string | null;
  readonly onChange: (id: string) => void;
  readonly emptyMessage: string;
  readonly onCreateAccount?: () => void;
}

/** Sheet of account tiles; the breadcrumb owns when it is open. */
export function AccountPicker({
  open,
  onDismiss,
  title,
  accounts,
  selectedId,
  onChange,
  emptyMessage,
  onCreateAccount,
}: AccountPickerProps) {
  const createAccount = onCreateAccount
    ? () => {
        onDismiss();
        afterSheetCloses(onCreateAccount);
      }
    : undefined;

  return (
    <Sheet open={open} onDismiss={onDismiss} title={title}>
      {accounts.length === 0 ? (
        <EmptyState
          actionLabel={createAccount ? "Add account" : undefined}
          framed={false}
          icon="bank"
          message={emptyMessage}
          onAction={createAccount}
          title="No accounts to pick"
        />
      ) : (
        <View accessibilityLabel={title} accessibilityRole="radiogroup" style={styles.list}>
          {accounts.map((account) => (
            <OptionTile
              emoji={accountTypeOption(account.type).emoji}
              key={account.id}
              name={account.name}
              onPress={() => {
                onChange(account.id);
                onDismiss();
              }}
              selected={account.id === selectedId}
              subtitle={accountTileSubtitle(account.currency, account.balanceMinor)}
            />
          ))}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({ list: { gap: space[2] } });
