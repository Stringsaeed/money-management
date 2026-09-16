/**
 * TEMPORARY: Button Gallery for QA (#318)
 *
 * This screen exists solely to QA the Button StyleSheet migration.
 * Remove after #283 is merged and visual parity is confirmed.
 *
 * Route: /dev/button-gallery
 * Stim path: Deep link to exp://localhost:8081/--/dev/button-gallery
 *            or navigate via Expo Go: type URL manually
 */

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/lib/design-tokens";
import { Stack } from "expo-router";
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

export default function ButtonGalleryScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "🧪 Button Gallery", headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
    </>
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
});
