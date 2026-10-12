import { Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AiSettings } from "@/features/ai";
import { AnalyticsSettings } from "@/features/analytics";
import { SoundSettings } from "@/features/sound";
import { colors, layout, space } from "@/ui/trove";

import { AccountSection } from "./account-section";
import { DataSection } from "./data-section";
import { MoneySection } from "./money-section";
import { PreferencesSection } from "./preferences-section";
import { PrivacySection } from "./privacy-section";

/**
 * Settings, pushed from the ledger sheet under the native large-title header. The scroll view is
 * the screen root so the title collapses with it; its content takes the safe area. Each section
 * subscribes to its own data, so a toggle or a count change re-renders that card only.
 */
export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  // iOS insets the content itself (`automatic`); Android draws edge to edge under the nav bar.
  const bottomInset = Platform.OS === "android" ? insets.bottom : 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: space[8] + bottomInset }]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      <MoneySection />
      <PreferencesSection />
      <PrivacySection />
      <DataSection />
      <SoundSettings />
      <AiSettings />
      <AnalyticsSettings />
      <AccountSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bg.canvas, flex: 1 },
  content: {
    gap: space[4],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[2],
  },
});
