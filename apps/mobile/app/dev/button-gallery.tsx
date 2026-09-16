/**
 * TEMPORARY: Button Gallery for QA (#318)
 *
 * TODO(#283): Delete this file after Button StyleSheet migration QA is complete.
 *
 * This screen exists solely to QA the Button StyleSheet migration.
 * It is gated by __DEV__ and will show an error in production builds.
 *
 * Route: /dev/button-gallery
 * Stim path: Deep link to exp://localhost:8081/--/dev/button-gallery
 */

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/lib/design-tokens";
import { Stack, router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

const VARIANTS = ["default", "destructive", "secondary", "outline", "ghost", "link"] as const;
const SIZES = ["default", "sm", "lg", "xl", "icon"] as const;

type ButtonVariant = (typeof VARIANTS)[number];
type ButtonSize = (typeof SIZES)[number];

function ButtonRow({
  variant,
  size,
  disabled,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled?: boolean;
}) {
  const label = size === "icon" ? "🔍" : `${variant}`;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>
        {variant}/{size}
        {disabled ? "/disabled" : ""}
      </Text>
      <Button variant={variant} size={size} disabled={disabled}>
        <Text>{label}</Text>
      </Button>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DevOnlyGate({ children }: { children: React.ReactNode }) {
  if (!__DEV__) {
    return (
      <View style={styles.gateContainer}>
        <Stack.Screen options={{ title: "Not Available", headerShown: true }} />
        <Text style={styles.gateText}>⚠️ Dev-only screen</Text>
        <Text style={styles.gateSubtext}>This screen is only available in development builds.</Text>
        <Button variant="outline" onPress={() => router.back()}>
          <Text>Go Back</Text>
        </Button>
      </View>
    );
  }
  return <>{children}</>;
}

export default function ButtonGalleryScreen() {
  return (
    <DevOnlyGate>
      <Stack.Screen options={{ title: "🧪 Button Gallery", headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.tempBanner}>
          <Text style={styles.tempBannerText}>⚠️ TEMPORARY — TODO(#283): Delete after QA</Text>
        </View>

        <Text style={styles.header}>Button StyleSheet Migration QA</Text>
        <Text style={styles.subheader}>Variants × Sizes × States (system light/dark)</Text>

        <Section title="Default Size (all variants)">
          {VARIANTS.map((variant) => (
            <ButtonRow key={variant} variant={variant} size="default" />
          ))}
        </Section>

        <Section title="Small Size (all variants)">
          {VARIANTS.map((variant) => (
            <ButtonRow key={variant} variant={variant} size="sm" />
          ))}
        </Section>

        <Section title="Large Size (all variants)">
          {VARIANTS.map((variant) => (
            <ButtonRow key={variant} variant={variant} size="lg" />
          ))}
        </Section>

        <Section title="XL Size (all variants)">
          {VARIANTS.map((variant) => (
            <ButtonRow key={variant} variant={variant} size="xl" />
          ))}
        </Section>

        <Section title="Icon Size (all variants)">
          {VARIANTS.map((variant) => (
            <ButtonRow key={variant} variant={variant} size="icon" />
          ))}
        </Section>

        <Section title="Disabled State (all variants, default size)">
          {VARIANTS.map((variant) => (
            <ButtonRow key={variant} variant={variant} size="default" disabled />
          ))}
        </Section>

        <Section title="Disabled State (all variants, sm size)">
          {VARIANTS.map((variant) => (
            <ButtonRow key={variant} variant={variant} size="sm" disabled />
          ))}
        </Section>

        <View style={styles.spacer} />
      </ScrollView>
    </DevOnlyGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[20],
  },
  tempBanner: {
    backgroundColor: colors.kumoWarningTint,
    borderWidth: 1,
    borderColor: colors.kumoWarning,
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  tempBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textWarning,
    textAlign: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  subheader: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: spacing[6],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    paddingVertical: spacing[1],
  },
  label: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontFamily: "monospace",
    flex: 1,
  },
  spacer: {
    height: spacing[10],
  },
  gateContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
    gap: spacing[4],
  },
  gateText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.foreground,
  },
  gateSubtext: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
  },
});
