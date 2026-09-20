import { format } from "date-fns";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";

import { RejectionKindBadge } from "@/components/rejected-changes/rejection-kind-badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import type { RejectedChange } from "@/modules/powersync/rejected-changes";
import { describeRejection } from "@/modules/powersync/rejection";
import { commandKindLabel, describeIntent } from "@/utils/intent-summary";

interface RejectedChangeCardProps {
  change: RejectedChange;
  onEdit: (change: RejectedChange) => void;
  onDiscard: (change: RejectedChange) => void;
}

/**
 * One entry of the Rejected Changes inbox (#94): what was attempted, the
 * exact typed rejection reason, when it happened, and the two escapes —
 * re-edit & resubmit, or discard.
 */
export function RejectedChangeCard({ change, onEdit, onDiscard }: RejectedChangeCardProps) {
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOut}
      layout={LinearTransition}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <RejectionKindBadge kind={change.rejection.kind} />
        <Text style={styles.timestamp}>{format(change.createdAt, "MMM d · HH:mm")}</Text>
      </View>

      <View style={styles.intentBlock}>
        <Text style={styles.intentTitle} numberOfLines={2}>
          {change.kind === "unknown"
            ? "Unknown change"
            : describeIntent(change.kind, change.payload)}
        </Text>
        <Text style={styles.kindLabel}>
          {change.kind === "unknown" ? "Unknown change" : commandKindLabel(change.kind)}
        </Text>
      </View>

      <Text style={styles.rejectionReason}>💬 {describeRejection(change.rejection)}</Text>

      <View style={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          style={styles.flex1}
          onPress={() => onEdit(change)}
          testID={`rejected-edit-${change.commandId}`}
        >
          <Text>✏️ Edit &amp; resubmit</Text>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          style={styles.flex1}
          onPress={() => onDiscard(change)}
          testID={`rejected-discard-${change.commandId}`}
        >
          <Text style={styles.discardLabel}>🗑️ Discard</Text>
        </Button>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    padding: spacing[4],
    borderCurve: "continuous",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  timestamp: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
  intentBlock: {
    gap: spacing[1],
  },
  intentTitle: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textLg,
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
  rejectionReason: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.terracotta,
  },
  actions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  flex1: {
    flex: 1,
  },
  discardLabel: {
    color: colors.destructive,
  },
});
