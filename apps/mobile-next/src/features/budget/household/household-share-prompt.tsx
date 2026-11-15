import { StyleSheet, View } from "react-native";

import { AmountInput, Text } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { PanelError } from "../envelope/panel-error";
import { HomePromptCard } from "../home/home-prompt-card";

import { HOUSEHOLD_SHARE_NAME } from "./share-model";
import { useHouseholdShare } from "./use-household-share";

/** H2, after the household budget exists: offer your share as a Bill in your Personal budget. */
export function HouseholdSharePrompt() {
  const share = useHouseholdShare();
  const currency = useBudgetCurrency();
  if (!share.offered) return null;
  return (
    <HomePromptCard
      link={{ label: "Not now", onPress: share.notNow }}
      message="A Bill in your own budget for what you put into this household each month. Your Personal budget stays separate."
      primary={{
        label: "Add to Personal budget",
        loading: share.busy,
        disabled: !share.ready,
        onPress: () => void share.add(),
      }}
      title={`Add ${HOUSEHOLD_SHARE_NAME} to your Personal budget?`}
    >
      <View style={styles.fields}>
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
      </View>
    </HomePromptCard>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 8 },
});
