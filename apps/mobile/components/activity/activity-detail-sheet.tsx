import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import { effectEmoji, formatActivityFullTimestamp } from "@/utils/activity";

import type { ActivityEntry } from "@/hooks/use-activity";

interface ActivityDetailSheetProps {
  /** The tapped entry, or null to keep the sheet closed. */
  readonly entry: ActivityEntry | null;
  readonly onDismiss: () => void;
}

function DetailRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailEmoji}>{emoji}</Text>
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

/**
 * Tap-for-details sheet for one activity entry (#95): the full action
 * summary, who made the change, exactly when, and every affected entity.
 * Closed state is controlled by the parent passing `entry: null`.
 */
export function ActivityDetailSheet({ entry, onDismiss }: ActivityDetailSheetProps) {
  const insets = useSafeAreaInsets();

  if (!entry) {
    return null;
  }

  return (
    <ModalBottomSheet open onDismiss={onDismiss}>
      <View style={[styles.sheetBody, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{effectEmoji(entry.effects[0] ?? "")}</Text>
          <Text style={styles.headerTitle}>{entry.summary}</Text>
        </View>

        <View style={styles.detailCard}>
          <DetailRow emoji="👤" label="Made by" value={entry.userName} />
          <DetailRow emoji="🕒" label="When" value={formatActivityFullTimestamp(entry.createdAt)} />
          <DetailRow emoji="#️⃣" label="Change #" value={`seq ${entry.seq}`} />
        </View>

        <View style={styles.effectsSection}>
          <Text style={styles.effectsHeading}>Affected entities 🎯</Text>
          <View style={styles.effectsRow}>
            {entry.effects.length > 0 ? (
              entry.effects.map((tag) => (
                <View key={tag} style={styles.effectChip}>
                  <Text style={styles.effectEmoji}>{effectEmoji(tag)}</Text>
                  <Text style={styles.effectLabel}>{tag}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyEffects}>Nothing specific</Text>
            )}
          </View>
        </View>

        <Button
          size="xl"
          style={styles.doneButton}
          onPress={onDismiss}
        >
          <Text>Done</Text>
        </Button>
      </View>
    </ModalBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBody: {
    width: "100%",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    gap: spacing[3],
  },
  header: {
    alignItems: "center",
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  headerEmoji: {
    fontSize: typography.text4xl,
  },
  headerTitle: {
    fontFamily: typography.fontHeadingMedium,
    fontStyle: "italic",
    fontSize: typography.textXl,
    color: colors.ink,
    textAlign: "center",
  },
  detailCard: {
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    gap: spacing[1],
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[2.5],
  },
  detailEmoji: {
    fontSize: typography.textLg,
    width: 28,
    textAlign: "center",
  },
  detailBody: {
    flex: 1,
    gap: spacing[0.5],
  },
  detailLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
    letterSpacing: typography.trackingWide,
    textTransform: "uppercase",
  },
  detailValue: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  effectsSection: {
    gap: spacing[1.5],
    marginTop: spacing[1],
  },
  effectsHeading: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
    letterSpacing: typography.trackingWide,
    textTransform: "uppercase",
  },
  effectsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1.5],
  },
  effectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    borderRadius: radii.full,
    backgroundColor: colors.surfaceDim,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
  },
  effectEmoji: {
    fontSize: typography.textXs,
  },
  effectLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.7,
    textTransform: "capitalize",
  },
  emptyEffects: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
  doneButton: {
    marginHorizontal: spacing[8],
    marginTop: spacing[3],
  },
});
