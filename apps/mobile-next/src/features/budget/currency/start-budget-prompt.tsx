import { router } from "expo-router";
import { StyleSheet } from "react-native";

import { promptCurrencies } from "@/data/budget-currency";
import { useAccountsQuery, useSelectedBudget } from "@/data/ledger-queries";
import { Button, Card, space, Text } from "@/ui/trove";

import { useBudgetRole } from "../role/use-budget-role";
import { setupHref } from "../setup/setup-routes";

/**
 * #310: the ledger has an active account in a currency with no budget yet. One dismissible card,
 * below the budget so it never gets in the way of the monthly loop. "Not now" keeps it away until
 * a new account in that currency appears.
 */
export function StartBudgetPrompt() {
  const accounts = useAccountsQuery();
  const { budgets, choice, dismissPrompt } = useSelectedBudget();
  const { canEditPlan } = useBudgetRole();
  const [currency] = promptCurrencies(
    accounts.data,
    budgets.map((budget) => budget.currency),
    choice.dismissed,
  );
  if (currency === undefined || budgets.length === 0 || !canEditPlan) return null;

  const count = accounts.data.filter(
    (account) => !account.archived && account.currency === currency,
  ).length;
  return (
    <Card style={styles.card}>
      <Text variant="titleMd">{`Start a ${currency} budget`}</Text>
      <Text tone="secondary" variant="bodySm">
        {`You have ${count} ${currency} ${count === 1 ? "account" : "accounts"}. A ${currency} budget has its own envelopes, payday and Safe to spend. Nothing is converted between currencies.`}
      </Text>
      <Button
        fullWidth
        label={`Start ${currency} budget`}
        onPress={() => router.push(setupHref("payday", currency))}
      />
      <Button
        fullWidth
        label="Not now"
        variant="tertiary"
        onPress={() => void dismissPrompt(currency, accounts.data)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[2] },
});
