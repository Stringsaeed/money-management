import { router } from "expo-router";
import * as Updates from "expo-updates";
import { ScrollView, StyleSheet, View } from "react-native";

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
import { colors, spacing, typography } from "@/lib/design-tokens";
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
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
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
        <View style={styles.aboutContainer}>
          <Text style={styles.aboutEmoji}>💰</Text>
          <Text style={styles.aboutTitle}>Money Manager</Text>
          <Text style={styles.aboutTagline}>Track your finances, simply.</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contentContainer: {
    paddingBottom: spacing[16],
  },
  aboutContainer: {
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[6],
    gap: spacing[1],
  },
  aboutEmoji: {
    fontSize: typography.text4xl,
    marginBottom: spacing[2],
  },
  aboutTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  aboutTagline: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  aboutVersion: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.2,
    marginTop: spacing[2],
  },
});
