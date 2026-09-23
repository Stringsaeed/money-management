/* oxlint-disable complexity -- this form owns the small Account field state and validation surface. */

import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { TextField } from "@/ui/text-field";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";
import type { AccountInput, AccountType } from "@/data/ledger-client";
import { decimalFromMinor, parseMoneyMinor } from "@/utils/money";

interface AccountFormProps {
  readonly account?: V2Account;
  readonly busy?: boolean;
  readonly error?: string;
  readonly onCancel?: () => void;
  readonly onSubmit: (input: AccountInput) => Promise<void>;
}

const ACCOUNT_TYPES: readonly AccountType[] = [
  "checking",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "other",
];
const CURRENCIES = ["USD", "AED", "EUR", "GBP", "JPY"] as const;

function accountTypeOf(value: string | undefined): AccountType {
  switch (value) {
    case "checking":
    case "savings":
    case "cash":
    case "credit_card":
    case "investment":
    case "other":
      return value;
    default:
      return "checking";
  }
}

export function AccountForm({
  account,
  busy = false,
  error,
  onCancel,
  onSubmit,
}: AccountFormProps) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(accountTypeOf(account?.type));
  const [currency, setCurrency] = useState(account?.currency ?? "USD");
  const [openingBalance, setOpeningBalance] = useState(
    account ? decimalFromMinor(account.openingBalanceMinor, account.currency) : "0",
  );
  const [validationError, setValidationError] = useState<string>();

  const submit = async () => {
    const amountMinor = parseMoneyMinor(openingBalance || "0", currency);
    if (!name.trim()) {
      setValidationError("Enter an account name.");
      return;
    }
    if (amountMinor === null) {
      setValidationError(`Enter a valid ${currency} opening balance.`);
      return;
    }
    setValidationError(undefined);
    await onSubmit({ name: name.trim(), type, currency, openingBalanceMinor: amountMinor });
  };

  return (
    <View style={styles.content}>
      <Text variant="title">{account ? "Edit Account" : "Add Account"}</Text>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Main checking"
        autoCapitalize="words"
      />
      <TextField
        label="Opening balance"
        value={openingBalance}
        onChangeText={setOpeningBalance}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <View style={styles.group}>
        <Text variant="label">Type</Text>
        <View style={styles.chips}>
          {ACCOUNT_TYPES.map((item) => (
            <Chip
              key={item}
              label={item.replace("_", " ")}
              selected={type === item}
              onPress={() => setType(item)}
            />
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <Text variant="label">Currency</Text>
        <View style={styles.chips}>
          {CURRENCIES.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={currency === item}
              onPress={() => setCurrency(item)}
            />
          ))}
        </View>
      </View>
      {(error ?? validationError) ? (
        <Text style={styles.error}>{error ?? validationError}</Text>
      ) : null}
      <View style={styles.actions}>
        {onCancel ? <Button title="Cancel" variant="ghost" onPress={onCancel} /> : null}
        <Button
          title={account ? "Save changes" : "Create account"}
          onPress={() => void submit()}
          loading={busy}
          disabled={!name.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing[4], paddingBottom: spacing[8] },
  group: { gap: spacing[2] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  actions: { flexDirection: "row", gap: spacing[2], justifyContent: "flex-end" },
  error: { color: colors.destructive },
});
