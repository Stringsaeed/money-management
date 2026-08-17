import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import * as Updates from "expo-updates";

import { Card } from "@/components/settings/card";
import { DevToolsSection } from "@/components/settings/dev-tools-section";
import { Divider } from "@/components/settings/divider";
import { SectionHeader } from "@/components/settings/section-header";
import { SettingsRow } from "@/components/settings/settings-row";
import { UpdateSection } from "@/components/settings/update-section";
import { Text } from "@/components/ui/text";
import { useDatabase } from "@/db/client";
import {
  accounts as accountsTable,
  categories,
  exchangeRates,
  recurringOccurrences,
  recurringRules,
  transactions,
} from "@/db/schema";
import { clearSeedVersion } from "@/db/seed";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useRecurringRulesList } from "@/hooks/use-recurring-rules";
import { useTransactions } from "@/hooks/use-transactions";
import { cohereLedgerCache } from "@/modules/ledger-cache";

export default function SettingsScreen() {
  const db = useDatabase();
  const qc = useQueryClient();
  const [erasing, setErasing] = useState(false);
  const { data: accounts = [] } = useAccountsWithBalances();
  const { data: allCategories = [] } = useCategories();
  const { data: recurring = [] } = useRecurringRulesList("current");
  const { data: allTransactions = [] } = useTransactions({});

  const totalCategories = allCategories.length;
  const activeRecurring = recurring.filter((rule) => rule.lifecycle === "active").length;

  function handleEraseAll() {
    Alert.alert(
      "Erase All Data",
      "This will permanently delete all accounts, categories, transactions, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase Everything",
          style: "destructive",
          onPress: async () => {
            setErasing(true);
            try {
              await db.delete(recurringOccurrences);
              await db.delete(transactions);
              await db.delete(recurringRules);
              await db.delete(categories);
              await db.delete(exchangeRates);
              await db.delete(accountsTable);
              // Rewind the seed so the next launch re-inserts the default
              // categories the erase just removed.
              await clearSeedVersion(db);
              await cohereLedgerCache(qc, { kind: "ledger.reset" });
              router.replace("/onboarding");
            } catch {
              Alert.alert("Error", "Failed to erase data — please try again.");
            } finally {
              setErasing(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="pb-safe-offset-12"
    >
      {/* Manage */}
      <SectionHeader title="Manage 🛠️" />
      <Card>
        <SettingsRow
          emoji="💳"
          label="Accounts"
          subtitle={`${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`}
          onPress={() => router.push("/accounts")}
        />
        <Divider />
        <SettingsRow
          emoji="🏷️"
          label="Categories"
          subtitle={`${totalCategories} ${totalCategories === 1 ? "category" : "categories"}`}
          onPress={() => router.push("/categories")}
        />
        <Divider />
        <SettingsRow
          emoji="🔁"
          label="Recurring Rules"
          subtitle={`${activeRecurring} active`}
          onPress={() => router.push("/recurring")}
        />
      </Card>

      {/* Stats */}
      <SectionHeader title="Stats 📊" />
      <Card>
        <SettingsRow
          emoji="🧾"
          label="Total Transactions"
          rightLabel={String(allTransactions.length)}
          noChevron
        />
        <Divider />
        <SettingsRow emoji="🏦" label="Accounts" rightLabel={String(accounts.length)} noChevron />
        <Divider />
        <SettingsRow
          emoji="🔁"
          label="Active Rules"
          rightLabel={String(activeRecurring)}
          noChevron
        />
      </Card>

      <UpdateSection />

      {/* About */}
      <SectionHeader title="About ℹ️" />
      <Card>
        <View className="items-center px-4 py-6 gap-1">
          <Text className="text-4xl mb-2">💰</Text>
          <Text className="font-heading-normal text-xl italic text-ink">Money Manager</Text>
          <Text className="font-body-normal text-xs text-ink/40">Track your finances, simply.</Text>
          <Text className="font-body-normal text-xs text-ink/20 mt-2">Version 1.0.0</Text>
        </View>
      </Card>

      {/* Danger Zone */}
      <SectionHeader title="Danger Zone ⚠️" />
      <Card>
        <Pressable
          onPress={handleEraseAll}
          disabled={erasing}
          className="px-4 py-3.5 items-center active:bg-destructive/10"
        >
          <Text className="font-body-semibold text-base text-destructive">
            {erasing ? "Erasing…" : "Erase All Data"}
          </Text>
          <Text className="font-body-normal text-xs text-ink/40 mt-0.5">
            Permanently delete all accounts, categories, and transactions
          </Text>
        </Pressable>
      </Card>

      {/* Dev Tools — only in development or preview builds */}
      {(__DEV__ || Updates.channel === "preview") && <DevToolsSection />}
    </ScrollView>
  );
}
