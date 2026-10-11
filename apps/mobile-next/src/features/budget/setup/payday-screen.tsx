import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useAccountsQuery } from "@/data/ledger-queries";
import { Button, ListGroup, ListRow, space, Switch, Text, TextField } from "@/ui/trove";

import { FundingSection } from "./funding-section";
import { PaydayPicker } from "./payday-picker";
import { SetupFrame } from "./setup-frame";
import { SetupStatus } from "./setup-status";
import { fundingChoice, parseAmountText, paydayStepReady } from "./setup-plan";
import { useSetupDraft } from "./use-setup-draft";

/** S2: payday, usual salary, payday reminder, and the money you have right now. */
export function PaydayScreen() {
  const { draft, update, ready } = useSetupDraft();
  const accounts = useAccountsQuery();

  if (accounts.isError && accounts.data.length === 0) {
    return (
      <SetupStatus
        error={{ title: "Couldn't load your accounts", onRetry: () => void accounts.retry() }}
      />
    );
  }

  const funding = fundingChoice(accounts.data, draft);
  const salaryInvalid = parseAmountText(draft.usualSalary) === null;
  const needsAccount = funding.openingCashMinor === null && funding.accountIds.length === 0;
  const canContinue = ready && !accounts.isLoading && paydayStepReady(draft, funding);

  return (
    <SetupFrame
      step="Step 1 of 3"
      title="Payday and money"
      intro="No bank connection needed. You can change all of this later."
      footer={
        <>
          {needsAccount ? (
            <Text tone="secondary" variant="bodySm">
              Tick at least one account that holds your money.
            </Text>
          ) : null}
          <Button
            fullWidth
            label="Next"
            disabled={!canContinue}
            onPress={() => {
              update({ step: "items" });
              router.push("/budget/setup/items");
            }}
          />
        </>
      }
    >
      <View style={styles.group}>
        <Text variant="titleMd">When do you get paid?</Text>
        <PaydayPicker value={draft.payday} onChange={(payday) => update({ payday })} />
      </View>
      <TextField
        label="Usual salary (optional)"
        placeholder={`${BUDGET_CURRENCY} 0`}
        keyboardType="decimal-pad"
        value={draft.usualSalary}
        onChangeText={(usualSalary) => update({ usualSalary })}
        error={salaryInvalid ? "Enter an amount like 12000 or 12000.50." : undefined}
      />
      <ListGroup dividerInset={0}>
        <ListRow
          title="Remind me on payday"
          subtitle="A reminder only. Nothing is added to your ledger for you."
          trailing={
            <Switch
              accessibilityLabel="Remind me on payday"
              value={draft.paydayReminder}
              onValueChange={(paydayReminder) => update({ paydayReminder })}
            />
          }
        />
      </ListGroup>
      <FundingSection
        accounts={accounts.data}
        draft={draft}
        totalInvalid={funding.invalid}
        onTick={(accountId, ticked) =>
          update({ funding: { ...draft.funding, [accountId]: ticked } })
        }
        onTotal={(openingCash) => update({ openingCash })}
      />
    </SetupFrame>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[3] },
});
