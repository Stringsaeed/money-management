import { ScrollView, StyleSheet } from "react-native";

import { AiSettings } from "@/features/ai";
import { AnalyticsSettings } from "@/features/analytics";
import { SoundSettings } from "@/features/sound";
import { layout, Screen, space } from "@/ui/trove";

import { AccountSection } from "./account-section";
import { DataSection } from "./data-section";
import { MoneySection } from "./money-section";
import { PreferencesSection } from "./preferences-section";
import { PrivacySection } from "./privacy-section";
import { SettingsHeader } from "./settings-header";

export interface SettingsScreenProps {
  readonly onBack: () => void;
}

/**
 * Settings, pushed from the ledger sheet. Each section subscribes to its own data, so a toggle
 * or a count change re-renders that card only.
 */
export function SettingsScreen({ onBack }: SettingsScreenProps) {
  return (
    <Screen>
      <SettingsHeader onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MoneySection />
        <PreferencesSection />
        <PrivacySection />
        <DataSection />
        <SoundSettings />
        <AiSettings />
        <AnalyticsSettings />
        <AccountSection />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: space[4],
    paddingBottom: space[8],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[4],
  },
});
