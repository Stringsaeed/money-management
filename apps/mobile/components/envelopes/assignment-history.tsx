import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { AssignmentHistoryEntry } from "@/modules/budgeting/budgeting";

interface AssignmentHistoryProps {
  entries: readonly AssignmentHistoryEntry[];
  error: Error | null;
  isLoading: boolean;
  onSelectOriginal: (assignment: AssignmentHistoryEntry) => void;
  selectedOriginalId: string | null;
}

export function AssignmentHistory({
  entries,
  error,
  isLoading,
  onSelectOriginal,
  selectedOriginalId,
}: AssignmentHistoryProps) {
  const reversedAssignmentIds = new Set(
    entries.flatMap((entry) => (entry.reversesAssignmentId ? [entry.reversesAssignmentId] : [])),
  );
  const handleSelect = (entry: AssignmentHistoryEntry) => () => onSelectOriginal(entry);
  if (isLoading) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
        <Text className="font-body-normal text-sm text-ink/60">Loading history…</Text>
      </Animated.View>
    );
  }
  if (error) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
        <Text role="alert" className="text-sm text-destructive">
          Assignment history could not be loaded.
        </Text>
      </Animated.View>
    );
  }
  if (entries.length === 0) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
        <Text className="font-body-normal text-sm text-ink/60">
          No Assignments in this Budget Period.
        </Text>
      </Animated.View>
    );
  }
  return (
    <Animated.View
      accessibilityLabel="Assignment history"
      className="gap-2"
      entering={FadeIn}
      exiting={FadeOut}
      layout={layoutTransition}
    >
      <Text className="font-heading-medium text-lg italic text-ink">Assignment history</Text>
      {entries.map((entry) => {
        const isCorrectionCandidate =
          entry.kind === "original" && !reversedAssignmentIds.has(entry.id);
        const isSelected = entry.id === selectedOriginalId;
        return (
          <Pressable
            accessibilityLabel={`Assignment ${entry.id}, ${entry.kind}`}
            accessibilityRole={isCorrectionCandidate ? "button" : undefined}
            accessibilityState={{ selected: isSelected }}
            className="rounded-xl bg-surface-container px-4 py-3"
            disabled={!isCorrectionCandidate}
            key={entry.id}
            onPress={isCorrectionCandidate ? handleSelect(entry) : undefined}
          >
            <Text className="font-body-medium text-sm text-ink">
              {entry.kind} · {entry.amountMinor} minor units
            </Text>
            <Text className="font-body-normal text-xs text-ink/60">{entry.id}</Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}
