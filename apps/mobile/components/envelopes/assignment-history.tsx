import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { AssignmentHistoryEntry } from "@/modules/budgeting/budgeting";

interface AssignmentHistoryProps {
  entries: readonly AssignmentHistoryEntry[];
  error: Error | null;
  isLoading: boolean;
  onSelectOriginal: (assignmentId: string) => void;
  selectedOriginalId: string | null;
}

export function AssignmentHistory({
  entries,
  error,
  isLoading,
  onSelectOriginal,
  selectedOriginalId,
}: AssignmentHistoryProps) {
  const handleSelect = (assignmentId: string) => () => onSelectOriginal(assignmentId);
  if (isLoading)
    return <Text className="font-body-normal text-sm text-ink/60">Loading history…</Text>;
  if (error) {
    return (
      <Text role="alert" className="text-sm text-destructive">
        Assignment history could not be loaded.
      </Text>
    );
  }
  if (entries.length === 0) {
    return (
      <Text className="font-body-normal text-sm text-ink/60">
        No Assignments in this Budget Period.
      </Text>
    );
  }
  return (
    <View accessibilityLabel="Assignment history" className="gap-2">
      <Text className="font-heading-medium text-lg italic text-ink">Assignment history</Text>
      {entries.map((entry) => {
        const isCorrectionCandidate = entry.kind === "original";
        const isSelected = entry.id === selectedOriginalId;
        return (
          <Pressable
            accessibilityLabel={`Assignment ${entry.id}, ${entry.kind}`}
            accessibilityRole={isCorrectionCandidate ? "button" : undefined}
            accessibilityState={{ selected: isSelected }}
            className="rounded-xl bg-surface-container px-4 py-3"
            disabled={!isCorrectionCandidate}
            key={entry.id}
            onPress={isCorrectionCandidate ? handleSelect(entry.id) : undefined}
          >
            <Text className="font-body-medium text-sm text-ink">
              {entry.kind} · {entry.amountMinor} minor units
            </Text>
            <Text className="font-body-normal text-xs text-ink/60">{entry.id}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
