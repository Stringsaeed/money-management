import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { CaretRightIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { ActivityEntryRowProps } from "./types";
import { effectEmoji, formatActivityTimestamp } from "@/utils/activity";

/**
 * One chronological entry on the activity timeline: who did it, what changed
 * (server-decoded action summary), when, and the affected entities as emoji
 * chips — one per effect tag the command invalidated.
 */
export function ActivityEntryRow({ entry, onPress }: ActivityEntryRowProps) {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${entry.userName}: ${entry.summary}`}
        onPress={() => onPress?.(entry)}
        className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70"
      >
        <Text className="text-xl w-8 text-center">{effectEmoji(entry.effects[0] ?? "")}</Text>
        <View className="flex-1 gap-1">
          <Text className="font-heading-medium italic text-base text-ink" numberOfLines={2}>
            {entry.summary}
          </Text>
          <Text className="font-body-normal text-xs text-ink/50">
            {entry.userName} · {formatActivityTimestamp(entry.createdAt)}
          </Text>
          {entry.effects.length > 0 ? (
            <View className="flex-row flex-wrap gap-1 mt-0.5">
              {entry.effects.map((tag) => (
                <View
                  key={tag}
                  className="flex-row items-center gap-0.5 rounded-full bg-surface-dim px-2 py-0.5"
                >
                  <Text className="text-[10px]">{effectEmoji(tag)}</Text>
                  <Text className="font-body-medium text-[11px] text-ink/60 capitalize">{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {onPress ? <Icon as={CaretRightIcon} className="text-ink/20" size={16} /> : null}
      </Pressable>
    </Animated.View>
  );
}
