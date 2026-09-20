import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { CaretRightIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { colors, radii, rawColorValues, spacing, typography } from "@/lib/design-tokens";
import type { ActivityEntryRowProps } from "./types";
import { effectEmoji, formatActivityTimestamp } from "@/utils/activity";

/**
 * One chronological entry on the activity timeline: who did it, what changed
 * (server-decoded action summary), when, and the affected entities as emoji
 * chips — one per effect tag the command invalidated.
 */
export function ActivityEntryRow({ entry, onPress }: ActivityEntryRowProps) {
  const colorScheme = useColorScheme();
  const inkHex = colorScheme === "dark" ? rawColorValues.dark.ink : rawColorValues.light.ink;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${entry.userName}: ${entry.summary}`}
        onPress={() => onPress?.(entry)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <Text style={styles.emoji}>{effectEmoji(entry.effects[0] ?? "")}</Text>
        <View style={styles.body}>
          <Text style={styles.summary} numberOfLines={2}>
            {entry.summary}
          </Text>
          <Text style={styles.meta}>
            {entry.userName} · {formatActivityTimestamp(entry.createdAt)}
          </Text>
          {entry.effects.length > 0 ? (
            <View style={styles.effects}>
              {entry.effects.map((tag) => (
                <View key={tag} style={styles.effectChip}>
                  <Text style={styles.effectEmoji}>{effectEmoji(tag)}</Text>
                  <Text style={styles.effectLabel}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {onPress ? (
          <Icon as={CaretRightIcon} size={16} style={{ color: inkHex, opacity: 0.2 }} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  rowPressed: {
    opacity: 0.7,
  },
  emoji: {
    fontSize: typography.textXl,
    width: 32,
    textAlign: "center",
  },
  body: {
    flex: 1,
    gap: spacing[1],
  },
  summary: {
    fontFamily: typography.fontHeadingMedium,
    fontStyle: "italic",
    fontSize: typography.textBase,
    color: colors.ink,
  },
  meta: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
  effects: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1],
    marginTop: spacing[0.5],
  },
  effectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[0.5],
    borderRadius: radii.full,
    backgroundColor: colors.surfaceDim,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  effectEmoji: {
    fontSize: 10,
  },
  effectLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.ink,
    opacity: 0.6,
    textTransform: "capitalize",
  },
});
