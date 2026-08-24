import { ScrollView, View } from "react-native";
import { router } from "expo-router";

import { RejectedChangeEditForm } from "@/components/rejected-changes/rejected-change-edit-form";
import { useRejectedEditForm } from "@/components/rejected-changes/use-rejected-edit-form";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { describeRejection } from "@/lib/sync/rejection";
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
  const { change, fields, isLoading, notFound, isSaving, saveError, setFieldValue, save } =
    useRejectedEditForm(commandId);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <Text className="px-5 pt-safe-offset-14 font-body-normal text-sm text-ink/50">
          Loading…
        </Text>
      </View>
    );
  }

  if (notFound || !change) {
    return (
      <View className="flex-1 gap-3 bg-surface px-5 pt-safe-offset-14">
        <Text className="text-4xl">🤔</Text>
        <Text className="font-heading-normal text-xl italic tracking-tight text-ink">
          Nothing to edit
        </Text>
        <Text className="font-body-normal text-sm text-ink/50">
          This rejected change was already discarded or resubmitted.
        </Text>
        <Button variant="outline" size="sm" onPress={() => router.back()}>
          <Text>← Back to inbox</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="gap-5 px-5 pt-safe-offset-14 pb-safe-offset-8">
        <View className="gap-1">
          <Text className="font-heading-medium text-2xl italic tracking-tight text-ink">
            Edit &amp; resubmit ✏️
          </Text>
          <Text className="font-body-normal text-xs uppercase tracking-wider text-ink/40">
            {commandKindLabel(change.kind)}
          </Text>
        </View>

        <View className="gap-2 rounded-2xl border border-ledger-outline bg-surface-container p-4">
          <Text
            className="font-heading-medium text-lg italic tracking-tight text-ink"
            numberOfLines={2}
          >
            {describeIntent(change.kind, change.payload)}
          </Text>
          <Text className="font-body-normal text-sm text-terracotta">
            💬 Why it was rejected: {describeRejection(change.rejection)}
          </Text>
        </View>

        <RejectedChangeEditForm fields={fields} onFieldChange={setFieldValue} />

        {saveError ? (
          <Text className="font-body-normal text-sm text-destructive">{saveError}</Text>
        ) : null}

        <View className="flex-row gap-2">
          <Button
            size="lg"
            variant="secondary"
            className="flex-1"
            disabled={isSaving}
            onPress={() => void save()}
          >
            <Text>{isSaving ? "Resubmitting…" : "📨 Resubmit"}</Text>
          </Button>
          <Button variant="ghost" size="lg" onPress={() => router.back()} disabled={isSaving}>
            <Text>Cancel</Text>
          </Button>
        </View>

        <Text className="font-body-normal text-xs text-ink/40">
          Resubmitting sends this as a fresh change with a new id — the original stays out of your
          queue.
        </Text>
      </ScrollView>
    </View>
  );
}
