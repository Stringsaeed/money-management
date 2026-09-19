import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { colors, radii, spacing } from "@/lib/design-tokens";

const EMOJI_OPTIONS = [
  // Money & finance
  "💰",
  "💵",
  "💳",
  "💸",
  "📈",
  "📉",
  // Food & drink
  "🍽️",
  "🛒",
  "☕",
  "🍕",
  // Transport
  "🚗",
  "🚌",
  "✈️",
  "⛽",
  // Home & living
  "🏠",
  "🛋️",
  "🔑",
  "🧹",
  // Health & wellness
  "🏥",
  "💊",
  "💆",
  "🏋️",
  // Entertainment
  "🎬",
  "🎮",
  "🎵",
  "📺",
  // Shopping & goods
  "🛍️",
  "👕",
  "📱",
  "🎁",
  // Work & education
  "💼",
  "📚",
  "💻",
  "🎓",
  // Utilities & services
  "⚡",
  "💧",
  "📡",
  "🔄",
  // Misc
  "🏷️",
  "📦",
  "🐾",
  "✨",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  options?: readonly string[];
}

export function EmojiPicker({ value, onChange, options = EMOJI_OPTIONS }: EmojiPickerProps) {
  return (
    <View style={styles.row}>
      {options.map((emoji) => {
        const isSelected = value === emoji;
        return (
          <Pressable
            key={emoji}
            accessibilityLabel={`Emoji ${emoji}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(emoji)}
            style={({ pressed }) => [
              styles.option,
              isSelected ? styles.optionSelected : styles.optionUnselected,
              pressed && !isSelected && styles.optionPressed,
            ]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  option: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.xl,
    borderCurve: "continuous",
  },
  optionUnselected: {
    backgroundColor: colors.muted,
  },
  optionSelected: {
    backgroundColor: colors.primary,
  },
  optionPressed: {
    backgroundColor: colors.accent,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 22,
  },
});
