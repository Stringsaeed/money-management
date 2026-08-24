import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { effectEmoji, formatActivityFullTimestamp } from "@/utils/activity";

import type { ActivityEntry } from "@/hooks/use-activity";

interface ActivityDetailSheetProps {
  /** The tapped entry, or null to keep the sheet closed. */
  readonly entry: ActivityEntry | null;
  readonly onDismiss: () => void;
}

function DetailRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-3 px-1 py-2.5">
      <Text className="text-lg w-7 text-center">{emoji}</Text>
      <View className="flex-1 gap-0.5">
        <Text className="font-body-medium text-xs text-ink/40 tracking-wide uppercase">
          {label}
        </Text>
        <Text className="font-body-normal text-sm text-ink">{value}</Text>
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
  if (!entry) {
    return null;
  }

  return (
    <ModalBottomSheet
      index={1}
      onIndexChange={(index) => {
        if (index === 0) {
          onDismiss();
        }
      }}
      scrimColor="rgba(0, 0, 0, 0.5)"
      surface={<View className="absolute inset-0 rounded-t-3xl bg-background" />}
    >
      <View className="pb-safe w-full px-5 pt-6 gap-3">
        <View className="items-center gap-1 mb-2">
          <Text className="text-4xl">{effectEmoji(entry.effects[0] ?? "")}</Text>
          <Text className="font-heading-medium italic text-xl text-ink text-center">
            {entry.summary}
          </Text>
        </View>

        <View className="rounded-xl bg-surface-container px-2 py-1 gap-1">
          <DetailRow emoji="👤" label="Made by" value={entry.userName} />
          <DetailRow emoji="🕒" label="When" value={formatActivityFullTimestamp(entry.createdAt)} />
          <DetailRow emoji="#️⃣" label="Change #" value={`seq ${entry.seq}`} />
        </View>

        <View className="gap-1.5 mt-1">
          <Text className="font-body-semibold text-xs text-ink/40 tracking-wide uppercase">
            Affected entities 🎯
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {entry.effects.length > 0 ? (
              entry.effects.map((tag) => (
                <View
                  key={tag}
                  className="flex-row items-center gap-1 rounded-full bg-surface-dim px-2.5 py-1"
                >
                  <Text className="text-xs">{effectEmoji(tag)}</Text>
                  <Text className="font-body-medium text-xs text-ink/70 capitalize">{tag}</Text>
                </View>
              ))
            ) : (
              <Text className="font-body-normal text-sm text-ink/50">Nothing specific</Text>
            )}
          </View>
        </View>

        <Button size="xl" className="mx-8 mt-3" onPress={onDismiss}>
          <Text>Done</Text>
        </Button>
      </View>
    </ModalBottomSheet>
  );
}
