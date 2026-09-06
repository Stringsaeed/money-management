import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import * as Updates from "expo-updates";

import { Card } from "@/components/settings/card";
import { DevToolsSection } from "@/components/settings/dev-tools-section";
import { Divider } from "@/components/settings/divider";
import { EraseLocalDataControl } from "@/components/settings/erase-local-data-control";
import { SectionHeader } from "@/components/settings/section-header";
import { SettingsRow } from "@/components/settings/settings-row";
import { UpdateSection } from "@/components/settings/update-section";
import { Text } from "@/components/ui/text";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useAllCategories } from "@/hooks/use-categories";
import { useRecurringRulesList } from "@/hooks/use-recurring-rules";
import { useTransactions } from "@/hooks/use-transactions";
import { returnTo, useAccess, type AccessState } from "@/modules/access";

export default function SettingsScreen() {
  const access = useAccess();
  const { data: accounts = [] } = useAccountsWithBalances();
  const { data: allCategories = [] } = useAllCategories();
  const { data: recurring = [] } = useRecurringRulesList("current");
  const { data: allTransactions = [] } = useTransactions({});

  const profileSubtitle = subtitleForAccess(access);
  const totalCategories = allCategories.length;
  const activeRecurring = recurring.filter((rule) => rule.lifecycle === "active").length;

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="pb-safe-offset-12"
    >
      {/* Profile */}
      <SectionHeader title="Profile" />
      <Card>
        <SettingsRow
          emoji="🏠"
          label="Profile & household"
          subtitle={profileSubtitle}
          onPress={access.kind === "resolving" ? undefined : () => onProfilePress(access)}
        />
      </Card>

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
        <Divider />
        <SettingsRow
          emoji="📜"
          label="Activity Timeline"
          subtitle="Who changed what, and when"
          onPress={() => router.push("/activity")}
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
        <EraseLocalDataControl />
      </Card>

      {/* Dev Tools — only in development or preview builds */}
      {(__DEV__ || Updates.channel === "preview") && <DevToolsSection />}
    </ScrollView>
  );
}

function onProfilePress(access: AccessState) {
  if (access.kind === "signed_in") {
    router.push("/(tabs)/settings/household");
    return;
  }
  if (access.kind === "anonymous") {
    access.beginAuth(returnTo.profileHousehold());
    return;
  }
  if (access.kind === "session_revoked") {
    access.reauthenticate(returnTo.profileHousehold());
  }
}

function subtitleForAccess(access: AccessState): string {
  if (access.kind === "signed_in") {
    return access.household.kind === "active" ? access.household.name : "No active household";
  }
  if (access.kind === "session_revoked") return "Signed out remotely";
  if (access.kind === "resolving") return "Loading…";
  return "Sign in or create profile";
}
