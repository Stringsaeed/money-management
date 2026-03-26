import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import * as Updates from "expo-updates";

import { AccountRow } from "@/components/settings/account-row";
import { Card } from "@/components/settings/card";
import { CategoryRow } from "@/components/settings/category-row";
import { DevToolsSection } from "@/components/settings/dev-tools-section";
import { Divider } from "@/components/settings/divider";
import { SectionHeader } from "@/components/settings/section-header";
import { SettingsRow } from "@/components/settings/settings-row";
import { Text } from "@/components/ui/text";
import { useDatabase } from "@/db/client";
import {
  accounts as accountsTable,
  appSettings,
  categories,
  exchangeRates,
  recurringPayments,
  transactions,
} from "@/db/schema";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useRecurringPayments } from "@/hooks/use-recurring-payments";
import { useTransactions } from "@/hooks/use-transactions";

export default function SettingsScreen() {
  const db = useDatabase();
  const qc = useQueryClient();
  const [erasing, setErasing] = useState(false);
  const { data: accounts = [] } = useAccountsWithBalances();
  const { data: expenseCategories = [] } = useCategories("expense");
  const { data: incomeCategories = [] } = useCategories("income");
  const { data: recurring = [] } = useRecurringPayments();
  const { data: allTransactions = [] } = useTransactions({});

  const totalCategories = expenseCategories.length + incomeCategories.length;
  const activeRecurring = recurring.filter((r) => r.isActive).length;

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
              await db.delete(transactions);
              await db.delete(recurringPayments);
              await db.delete(categories);
              await db.delete(exchangeRates);
              await db.delete(accountsTable);
              await db
                .update(appSettings)
                .set({ value: "false" })
                .where(eq(appSettings.key, "seeded"));
              qc.invalidateQueries();
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
      {/* Accounts */}
      <SectionHeader title="Accounts 💳" />
      <Card animated>
        {accounts.map((account, i) => (
          <Animated.View key={account.id} entering={FadeIn} exiting={FadeOut}>
            {i > 0 && <Divider />}
            <AccountRow account={account} />
          </Animated.View>
        ))}
        {accounts.length > 0 && <Divider />}
        <SettingsRow emoji="＋" label="Add Account" onPress={() => router.push("/account/new")} />
      </Card>

      {/* Manage */}
      <SectionHeader title="Manage 🛠️" />
      <Card>
        <SettingsRow
          emoji="🏷️"
          label="Categories"
          subtitle={`${totalCategories} ${totalCategories === 1 ? "category" : "categories"}`}
          onPress={() => router.push("/category/new")}
        />
        <Divider />
        <SettingsRow
          emoji="🔁"
          label="Recurring Payments"
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
          label="Active Recurring"
          rightLabel={String(activeRecurring)}
          noChevron
        />
      </Card>

      {/* Expense categories */}
      <SectionHeader title="Expense Categories 💸" />
      <Card animated>
        {expenseCategories.map((cat, i) => (
          <Animated.View key={cat.id} entering={FadeIn} exiting={FadeOut}>
            {i > 0 && <Divider />}
            <CategoryRow category={cat} />
          </Animated.View>
        ))}
        {expenseCategories.length > 0 && <Divider />}
        <SettingsRow
          emoji="＋"
          label="Add Expense Category"
          onPress={() => router.push("/category/new")}
        />
      </Card>

      {/* Income categories */}
      <SectionHeader title="Income Categories 💰" />
      <Card animated>
        {incomeCategories.map((cat, i) => (
          <Animated.View key={cat.id} entering={FadeIn} exiting={FadeOut}>
            {i > 0 && <Divider />}
            <CategoryRow category={cat} />
          </Animated.View>
        ))}
        {incomeCategories.length > 0 && <Divider />}
        <SettingsRow
          emoji="＋"
          label="Add Income Category"
          onPress={() => router.push("/category/new")}
        />
      </Card>

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
