import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

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
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2 py-1">
      {EMOJI_OPTIONS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onChange(emoji)}
          className={
            value === emoji
              ? "w-10 h-10 rounded-xl items-center justify-center bg-primary"
              : "w-10 h-10 rounded-xl items-center justify-center bg-muted active:bg-accent"
          }
          style={{ borderCurve: "continuous" }}
        >
          <Text className="text-[22px] leading-none">{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}
