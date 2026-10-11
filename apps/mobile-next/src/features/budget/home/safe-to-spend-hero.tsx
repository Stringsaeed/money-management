import { StyleSheet, View } from "react-native";

import { Amount, space, Text } from "@/ui/trove";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";
import { noSafeToSpendReason, perDayLine, type ActiveBudgetView } from "./home-model";

/** Safe to spend, the pace to payday, and (at exactly zero) the neutral reason there is none. */
export function SafeToSpendHero({ current }: { readonly current: ActiveBudgetView["current"] }) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  const reason = current.safeToSpendMinor === 0 ? noSafeToSpendReason(0) : null;
  const pace = perDayLine(current, money);
  return (
    <View
      accessible
      accessibilityLabel={`Safe to spend ${money(current.safeToSpendMinor)}. ${pace}${reason ? `. ${reason}` : ""}`}
      style={styles.hero}
    >
      <Text tone="secondary" variant="labelSm">
        Safe to spend
      </Text>
      <Amount
        currency={currency}
        minor={current.safeToSpendMinor}
        size="hero"
        tone={current.safeToSpendMinor < 0 ? "negative" : "primary"}
      />
      <Text tone="secondary" variant="bodySm">
        {pace}
      </Text>
      {reason ? (
        <Text tone="secondary" variant="bodySm">
          {reason}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space[1] },
});
