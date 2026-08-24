import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import Animated, { LinearTransition } from "react-native-reanimated";

import { RejectedChangeCard } from "@/components/rejected-changes/rejected-change-card";
import { RejectedChangesEmptyState } from "@/components/rejected-changes/rejected-changes-empty-state";
import { Text } from "@/components/ui/text";
import { useRejectedChanges } from "@/hooks/use-rejected-changes";

/**
 * The Rejected Changes inbox (#94): every command the server refused with its
 * typed reason. Tap Edit & resubmit to fix the original values in a
 * pre-populated form, or Discard to drop the change for good.
 */
export function RejectedChangesScreen() {
  const { changes, isLoading, error, discard } = useRejectedChanges();

  const handleEdit = (commandId: string) => {
    router.push({ pathname: "/rejected-change-edit", params: { commandId } });
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pt-safe-offset-14 pb-safe-offset-8"
      >
        <View className="gap-1">
          <Text className="font-heading-medium text-3xl italic tracking-tight text-ink">
            Rejected Changes 📥
          </Text>
          <Text className="font-body-normal text-sm text-ink/50">
            The server refused these changes — edit and resend them, or let them go.
          </Text>
        </View>

        {error ? (
          <Text className="font-body-normal text-sm text-destructive">
            Couldn&apos;t load the inbox: {error.message}
          </Text>
        ) : null}

        {isLoading ? (
          <Text className="font-body-normal text-sm text-ink/50">Loading…</Text>
        ) : changes.length === 0 ? (
          <RejectedChangesEmptyState />
        ) : (
          <Animated.View layout={LinearTransition} className="gap-4">
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
