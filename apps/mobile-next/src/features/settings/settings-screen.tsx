import { Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "expo-router/react-navigation";

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
 * Settings, pushed from the ledger sheet under a transparent native header. The scroll view is
 * the screen root and insets its own content: iOS adjusts for the header and home indicator
 * itself (`automatic`); Android, edge to edge, pads by the header height and nav bar.
 * Each section subscribes to its own data, so a toggle or a count change re-renders that card only.
 */
export function SettingsScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const android = Platform.OS === "android";

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        android
          ? { paddingTop: headerHeight + space[2], paddingBottom: space[8] + insets.bottom }
          : null,
      ]}
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
    paddingBottom: space[8],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[2],
  },
});
