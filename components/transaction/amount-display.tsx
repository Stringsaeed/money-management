import { View } from "react-native";
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";

import { Text } from "@/components/ui/text";
import { INK } from "./constants";

interface AmountDisplayProps {
  currencySymbol: string;
  value: number;
}

export function AmountDisplay({ currencySymbol, value }: AmountDisplayProps) {
  return (
    <View className="flex-row items-baseline">
      <Text
        className="font-heading-medium text-lg text-ink/30 mr-1"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {currencySymbol}
      </Text>
      <AnimatedRollingNumber
        useGrouping
        value={value}
        textStyle={{
          fontFamily: "Newsreader_500Medium",
          fontSize: 52,
          color: INK,
          lineHeight: 60,
        }}
      />
    </View>
  );
}
