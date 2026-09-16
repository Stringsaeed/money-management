import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RejectedChangeEditForm } from "@/components/rejected-changes/rejected-change-edit-form";
import { useRejectedEditForm } from "@/components/rejected-changes/use-rejected-edit-form";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import { describeRejection } from "@/modules/powersync/rejection";
import { commandKindLabel, describeIntent } from "@/utils/intent-summary";

interface RejectedChangeEditScreenProps {
  commandId: string | null;
}

/**
 * Re-edit screen for one rejected change (#94): shows the original intent and
 * its exact rejection reason above a form pre-populated with the original
 * values. Saving resubmits the command under a NEW commandId.
 */
export function RejectedChangeEditScreen({ commandId }: RejectedChangeEditScreenProps) {
  const insets = useSafeAreaInsets();
  const { change, fields, isLoading, notFound, isSaving, saveError, setFieldValue, save } =
    useRejectedEditForm(commandId);

  const topPad = insets.top + spacing[14];
  const bottomPad = insets.bottom + spacing[8];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.mutedText, { paddingHorizontal: spacing[5], paddingTop: topPad }]}>
          Loading…
        </Text>
      </View>
    );
  }

  if (notFound || !change) {
    return (
      <View style={[styles.notFound, { paddingTop: topPad, paddingHorizontal: spacing[5] }]}>
        <Text style={styles.emoji}>🤔</Text>
        <Text style={styles.notFoundTitle}>Nothing to edit</Text>
        <Text style={styles.mutedText}>
          This rejected change was already discarded or resubmitted.
        </Text>
        <Button variant="outline" size="sm" onPress={() => router.back()}>
          <Text>← Back to inbox</Text>
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topPad,
            paddingBottom: bottomPad,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Edit &amp; resubmit ✏️</Text>
          <Text style={styles.kindLabel}>
            {change.kind === "unknown" ? "Unknown change" : commandKindLabel(change.kind)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.intentTitle} numberOfLines={2}>
            {change.kind === "unknown"
              ? "Unknown change"
              : describeIntent(change.kind, change.payload)}
          </Text>
          <Text style={styles.rejectionReason}>
            💬 Why it was rejected: {describeRejection(change.rejection)}
          </Text>
        </View>

        <RejectedChangeEditForm fields={fields} onFieldChange={setFieldValue} />

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        <View style={styles.actions}>
          <Button
            size="lg"
            variant="secondary"
            style={styles.flex1}
            disabled={isSaving}
            onPress={() => void save()}
          >
            <Text>{isSaving ? "Resubmitting…" : "📨 Resubmit"}</Text>
          </Button>
          <Button variant="ghost" size="lg" onPress={() => router.back()} disabled={isSaving}>
            <Text>Cancel</Text>
          </Button>
        </View>

        <Text style={styles.footnote}>
          Resubmitting sends this as a fresh change with a new id — the original stays out of your
          queue.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    gap: spacing[5],
    paddingHorizontal: spacing[5],
  },
  notFound: {
    flex: 1,
    gap: spacing[3],
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: typography.text4xl,
  },
  notFoundTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    letterSpacing: typography.trackingTight,
    color: colors.ink,
  },
  header: {
    gap: spacing[1],
  },
  title: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.text2xl,
    fontStyle: "italic",
    letterSpacing: typography.trackingTight,
    color: colors.ink,
  },
  kindLabel: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    textTransform: "uppercase",
    letterSpacing: typography.trackingWider,
    color: colors.ink,
    opacity: 0.4,
  },
  summaryCard: {
    gap: spacing[2],
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    padding: spacing[4],
    borderCurve: "continuous",
  },
  intentTitle: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textLg,
    fontStyle: "italic",
    letterSpacing: typography.trackingTight,
    color: colors.ink,
  },
  rejectionReason: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.terracotta,
  },
  errorText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.destructive,
  },
  actions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  flex1: {
    flex: 1,
  },
  footnote: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  mutedText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
});
