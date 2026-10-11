import { StyleSheet } from "react-native";

import { AmountInput, Button, Card, space, Text } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { PanelError } from "../envelope/panel-error";

import { HOUSEHOLD_SHARE_NAME } from "./share-model";
import { useHouseholdShare } from "./use-household-share";

/** H2, after the household budget exists: offer your share as a Bill in your Personal budget. */
export function HouseholdSharePrompt() {
  const share = useHouseholdShare();
  const currency = useBudgetCurrency();
  if (!share.offered) return null;
  return (
    <Card style={styles.card}>
      <Text variant="titleMd">{`Add ${HOUSEHOLD_SHARE_NAME} to your Personal budget?`}</Text>
      <Text tone="secondary" variant="bodySm">
        A Bill in your own budget for what you put into this household each month. Your Personal
        budget stays separate.
      </Text>
      <AmountInput
        currency={currency}
        label="Your monthly share"
        value={share.amountText}
        onChangeText={share.setAmountText}
      />
      {share.problem ? (
        <Text accessibilityRole="alert" tone="warning" variant="bodySm">
          {share.problem}
        </Text>
      ) : null}
      <PanelError message={share.error} />
      <Button
        fullWidth
        label="Add to Personal budget"
        loading={share.busy}
        disabled={!share.ready}
        onPress={() => void share.add()}
      />
      <Button fullWidth label="Not now" variant="tertiary" onPress={share.notNow} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[2] },
});
