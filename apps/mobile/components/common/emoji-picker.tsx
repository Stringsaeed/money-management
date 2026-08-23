import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

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
    <View className="flex-row flex-wrap gap-2 py-1">
      {options.map((emoji) => (
        <Pressable
          key={emoji}
          accessibilityLabel={`Emoji ${emoji}`}
          accessibilityRole="button"
          accessibilityState={{ selected: value === emoji }}
          onPress={() => onChange(emoji)}
          className={cn(
            "h-10 w-10 items-center justify-center rounded-xl bg-muted active:bg-accent",
            value === emoji && "bg-primary",
          )}
          style={{ borderCurve: "continuous" }}
        >
          <Text className="text-[22px] leading-none">{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}
