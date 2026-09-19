import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RejectedChangeCard } from "@/components/rejected-changes/rejected-change-card";
import { RejectedChangesEmptyState } from "@/components/rejected-changes/rejected-changes-empty-state";
import { Text } from "@/components/ui/text";
import { useRejectedChanges } from "@/hooks/use-rejected-changes";
import { colors, spacing, typography } from "@/lib/design-tokens";

/**
 * The Rejected Changes inbox (#94): every command the server refused with its
 * typed reason. Tap Edit & resubmit to fix the original values in a
 * pre-populated form, or Discard to drop the change for good.
 */
export function RejectedChangesScreen() {
  const insets = useSafeAreaInsets();
  const { changes, isLoading, error, discard } = useRejectedChanges();

  const handleEdit = (commandId: string) => {
    router.push({ pathname: "/rejected-change-edit", params: { commandId } });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing[14],
            paddingBottom: insets.bottom + spacing[8],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Rejected Changes 📥</Text>
          <Text style={styles.subtitle}>
            The server refused these changes — edit and resend them, or let them go.
          </Text>
        </View>

        {error ? (
          <Text style={styles.errorText}>Couldn&apos;t load the inbox: {error.message}</Text>
        ) : null}

        {isLoading ? (
          <Text style={styles.mutedText}>Loading…</Text>
        ) : changes.length === 0 ? (
          <RejectedChangesEmptyState />
        ) : (
          <Animated.View layout={LinearTransition} style={styles.list}>
            {changes.map((change) => (
              <RejectedChangeCard
                key={change.commandId}
                change={change}
                onEdit={() => handleEdit(change.commandId)}
                onDiscard={() => void discard(change.commandId)}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing[4],
    paddingHorizontal: spacing[5],
  },
  header: {
    gap: spacing[1],
  },
  title: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.text3xl,
    fontStyle: "italic",
    letterSpacing: typography.trackingTight,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
  errorText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.destructive,
  },
  mutedText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
  list: {
    gap: spacing[4],
  },
});
