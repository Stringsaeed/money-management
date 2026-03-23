import { Pressable } from "react-native";

import { Text } from "@/components/ui/text";

interface BreadcrumbSegmentProps {
  emoji: string;
  label: string;
  active?: boolean;
  onPress?: VoidFunction;
}

export function BreadcrumbSegment({ emoji, label, active, onPress }: BreadcrumbSegmentProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container active:bg-surface-dim"
    >
      <Text className="text-[14px]">{emoji}</Text>
      <Text
        className={`font-body-medium text-[13px] ${active ? "text-ink" : "text-ink/35"}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
