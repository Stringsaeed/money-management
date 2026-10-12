import { router } from "expo-router";

import { useAccountsQuery, useCategoriesQuery, useRecurringQuery } from "@/data/ledger-queries";
import { SettingsRow, SettingsSection } from "@/ui/trove";

import { countValue, isCurrentRule, isUnarchived } from "./settings-counts";

/** Money: the ledger's accounts, categories and recurring rules, with live counts. */
export function MoneySection() {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const recurring = useRecurringQuery();

  return (
    <SettingsSection title="Money">
      <SettingsRow icon="coins" soon title="Main currency" />
      <SettingsRow
        chevron
        icon="accounts"
        onPress={() => router.push("/accounts")}
        title="Accounts"
        value={countValue(accounts, isUnarchived)}
      />
      <SettingsRow
        chevron
        icon="category"
        onPress={() => router.push("/categories")}
        title="Categories"
        value={countValue(categories, isUnarchived)}
      />
      <SettingsRow
        chevron
        icon="recurring"
        onPress={() => router.push("/recurring")}
        title="Recurring"
        value={countValue(recurring, isCurrentRule)}
      />
    </SettingsSection>
  );
}
