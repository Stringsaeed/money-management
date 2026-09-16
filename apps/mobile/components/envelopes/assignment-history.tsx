import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { AssignmentHistoryEntry } from "@/modules/budgeting/budgeting";

import { styles } from "./styles";

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
        <Text style={styles.textNormalSmInk60}>Loading history…</Text>
      </Animated.View>
    );
  }
  if (error) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
        <Text role="alert" style={styles.textDestructiveAlert}>
          Assignment history could not be loaded.
        </Text>
      </Animated.View>
    );
  }
  if (entries.length === 0) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
        <Text style={styles.textNormalSmInk60}>No Assignments in this Budget Period.</Text>
      </Animated.View>
    );
  }
  return (
    <Animated.View
      accessibilityLabel="Assignment history"
      entering={FadeIn}
      exiting={FadeOut}
      layout={layoutTransition}
      style={styles.gap2}
    >
      <Text style={styles.historyTitle}>Assignment history</Text>
      {entries.map((entry) => {
        const isCorrectionCandidate =
          entry.kind === "original" && !reversedAssignmentIds.has(entry.id);
        const isSelected = entry.id === selectedOriginalId;
        return (
          <Pressable
            accessibilityLabel={`Assignment ${entry.id}, ${entry.kind}`}
            accessibilityRole={isCorrectionCandidate ? "button" : undefined}
            accessibilityState={{ selected: isSelected }}
            disabled={!isCorrectionCandidate}
            key={entry.id}
            onPress={isCorrectionCandidate ? handleSelect(entry) : undefined}
            style={styles.historyEntry}
          >
            <Text style={styles.textMediumInkSm}>
              {entry.kind} · {entry.amountMinor} minor units
            </Text>
            <Text style={styles.textNormalXsInk60}>{entry.id}</Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}
