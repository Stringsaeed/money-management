import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Text } from "@/components/ui/text";

interface MarketStateCardProps {
  title: string;
  message: string;
}

export function MarketStateCard({ title, message }: MarketStateCardProps) {
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut}>
      <View className="mx-5 bg-surface-container p-5" style={{ borderCurve: "continuous" }}>
        <Text className="font-heading-normal text-2xl italic text-ink">{title}</Text>
        <Text className="mt-3 font-body-normal text-sm leading-6 text-ink/60">{message}</Text>
      </View>
    </Animated.View>
  );
}
