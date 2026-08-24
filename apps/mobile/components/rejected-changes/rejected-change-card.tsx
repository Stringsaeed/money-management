import { format } from "date-fns";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";

import { RejectionKindBadge } from "@/components/rejected-changes/rejection-kind-badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { RejectedChange } from "@/lib/sync/outbox";
import { describeRejection } from "@/lib/sync/rejection";
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
      className="gap-3 rounded-2xl border border-ledger-outline bg-surface-container p-4"
    >
      <View className="flex-row items-center justify-between gap-2">
        <RejectionKindBadge kind={change.rejection.kind} />
        <Text className="font-body-normal text-xs text-ink/50">
          {format(change.createdAt, "MMM d · HH:mm")}
        </Text>
      </View>

      <View className="gap-1">
        <Text
          className="font-heading-medium text-lg italic tracking-tight text-ink"
          numberOfLines={2}
        >
          {describeIntent(change.kind, change.payload)}
        </Text>
        <Text className="font-body-normal text-xs uppercase tracking-wider text-ink/40">
          {commandKindLabel(change.kind)}
        </Text>
      </View>

      <Text className="font-body-normal text-sm text-terracotta">
        💬 {describeRejection(change.rejection)}
      </Text>

      <View className="flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onPress={() => onEdit(change)}
          testID={`rejected-edit-${change.commandId}`}
        >
          <Text>✏️ Edit &amp; resubmit</Text>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onPress={() => onDiscard(change)}
          testID={`rejected-discard-${change.commandId}`}
        >
          <Text className="text-destructive">🗑️ Discard</Text>
        </Button>
      </View>
    </Animated.View>
  );
}
