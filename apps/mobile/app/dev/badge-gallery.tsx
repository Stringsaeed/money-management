/**
 * TODO(#284): Delete this file after QA is complete.
 * Temporary Badge gallery for Stim screenshot-diff and profiler testing.
 */

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VARIANTS: BadgeVariant[] = ["default", "secondary", "destructive", "outline"];

function DevNotAvailable() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.notAvailable}>
        <Text style={styles.notAvailableText}>🚧 Dev Gallery Not Available</Text>
        <Text style={styles.notAvailableSubtext}>
          This screen is only available in development.
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function BadgeGalleryScreen() {
  if (!__DEV__) {
    return <DevNotAvailable />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TODO(#284): Delete after QA banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>⚠️ TODO(#284): Delete after QA</Text>
        </View>

        <Text style={styles.title}>Badge Gallery</Text>
        <Text style={styles.subtitle}>All variants • System light/dark</Text>

        {/* Variants Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variants</Text>
          <View style={styles.row}>
            {VARIANTS.map((variant) => (
              <View key={variant} style={styles.item}>
                <Badge variant={variant}>
                  <Text>{variant}</Text>
                </Badge>
                <Text style={styles.label}>{variant}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* With Emoji Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>With Emoji</Text>
          <View style={styles.row}>
            <View style={styles.item}>
              <Badge variant="default">
                <Text>🎉 New</Text>
              </Badge>
            </View>
            <View style={styles.item}>
              <Badge variant="secondary">
                <Text>📊 Stats</Text>
              </Badge>
            </View>
            <View style={styles.item}>
              <Badge variant="destructive">
                <Text>🚨 Alert</Text>
              </Badge>
            </View>
            <View style={styles.item}>
              <Badge variant="outline">
                <Text>📌 Pinned</Text>
              </Badge>
            </View>
          </View>
        </View>

        {/* Count Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Counts</Text>
          <View style={styles.row}>
            <View style={styles.item}>
              <Badge variant="default">
                <Text>3</Text>
              </Badge>
            </View>
            <View style={styles.item}>
              <Badge variant="secondary">
                <Text>12</Text>
              </Badge>
            </View>
            <View style={styles.item}>
              <Badge variant="destructive">
                <Text>99+</Text>
              </Badge>
            </View>
            <View style={styles.item}>
              <Badge variant="outline">
                <Text>0</Text>
              </Badge>
            </View>
          </View>
        </View>

        {/* Long Text Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Long Text</Text>
          <View style={styles.column}>
            {VARIANTS.map((variant) => (
              <Badge key={variant} variant={variant}>
                <Text>Longer badge text example</Text>
              </Badge>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[6],
  },
  banner: {
    backgroundColor: colors.kumoWarningTint,
    borderRadius: 8,
    padding: spacing[3],
    alignItems: "center",
  },
  bannerText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.textWarning,
  },
  title: {
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.text2xl,
    color: colors.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textLg,
    color: colors.foreground,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  column: {
    gap: spacing[2],
    alignItems: "flex-start",
  },
  item: {
    alignItems: "center",
    gap: spacing[1],
  },
  label: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.mutedForeground,
  },
  notAvailable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[4],
    padding: spacing[6],
  },
  notAvailableText: {
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.textXl,
    color: colors.foreground,
  },
  notAvailableSubtext: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.primaryForeground,
  },
});
