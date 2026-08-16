import { FadeIn, FadeOut } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { View } from "react-native";
import { PressableScale } from "pressto";

interface BreadcrumbSegmentProps {
  emoji: string;
  label: string;
  active?: boolean;
  onPress?: VoidFunction;
}

export function BreadcrumbSegment({ emoji, label, active, onPress }: BreadcrumbSegmentProps) {
  return (
    <PressableScale onPress={onPress} entering={FadeIn} exiting={FadeOut}>
      <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container active:bg-surface-dim">
        <Text className="text-sm">{emoji}</Text>
        <Text
          className={`font-body-medium text-[13px] ${active ? "text-ink" : "text-ink/35"}`}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
