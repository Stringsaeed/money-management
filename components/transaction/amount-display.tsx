import { useColorScheme, View } from "react-native";
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";

import { Text } from "@/components/ui/text";

interface AmountDisplayProps {
  currencySymbol: string;
  value: number;
}

export function AmountDisplay({ currencySymbol, value }: AmountDisplayProps) {
  const colorScheme = useColorScheme();
  const inkColor = colorScheme === "dark" ? "#E8E6E3" : "#1C1B1A";

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
          color: inkColor,
          lineHeight: 60,
        }}
      />
    </View>
  );
}
