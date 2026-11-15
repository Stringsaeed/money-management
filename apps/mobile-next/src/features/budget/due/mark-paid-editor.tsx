import { StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import type { V2Account } from "@trove/api/v2/contracts";

import { useReducedMotion } from "@/ui/motion";
import { AmountInput, motion, SelectChip, space, Text, troveTransition } from "@/ui/trove";

import { accountTypeOption } from "../../ledger/accounts/account-display";
import { QuickAddDatePicker } from "../quick-add/quick-add-date-picker";

import type { MarkPaidField } from "./mark-paid-field";

interface MarkPaidEditorProps {
  readonly field: MarkPaidField;
  readonly currency: string;
  readonly amountText: string;
  readonly onAmount: (text: string) => void;
  readonly accounts: readonly V2Account[];
  readonly accountId: string;
  readonly onAccount: (id: string) => void;
  readonly date: string;
  readonly onDate: (date: string) => void;
  readonly onDone: () => void;
}

/** The editor for one Mark paid field. Changes apply to this payment only, never the bill. */
export function MarkPaidEditor(props: MarkPaidEditorProps) {
  const reducedMotion = useReducedMotion();
  const { field } = props;
  return (
    <EaseView
      animate={{ opacity: 1, translateY: 0 }}
      initialAnimate={{ opacity: 0, translateY: -6 }}
      key={field}
      style={styles.panel}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      {field === "amount" ? (
        <>
          <AmountInput
            autoFocus
            currency={props.currency}
            onChangeText={props.onAmount}
            value={props.amountText}
          />
          <Text tone="secondary" variant="bodySm">
            Changing the amount only affects this payment. The bill itself stays the same.
          </Text>
        </>
      ) : null}
      {field === "account" ? (
        <View accessibilityLabel="Paid from" accessibilityRole="radiogroup" style={styles.wrap}>
          {props.accounts.map((account) => (
            <SelectChip
              emoji={accountTypeOption(account.type).emoji}
              key={account.id}
              label={account.name}
              onPress={() => {
                props.onAccount(account.id);
                props.onDone();
              }}
              selected={account.id === props.accountId}
              size="md"
            />
          ))}
        </View>
      ) : null}
      {field === "date" ? (
        <QuickAddDatePicker
          date={props.date}
          onChange={(date) => {
            props.onDate(date);
            props.onDone();
          }}
        />
      ) : null}
    </EaseView>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space[2] },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
