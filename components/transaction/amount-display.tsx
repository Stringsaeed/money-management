import { View, Text } from "react-native";

import type useNumPadNumber from "@/hooks/use-num-pad-number";
import { cn } from "@/lib/utils";

interface AmountDisplayProps {
  currencySymbol: string;
  numPadConfig: ReturnType<typeof useNumPadNumber>;
}

export function AmountDisplay({ currencySymbol, numPadConfig }: AmountDisplayProps) {
  const integralPart = Math.floor(numPadConfig.value);
  const fractionalPart = Math.round((numPadConfig.value - integralPart) * 100);

  return (
    <View className="self-end flex-row justify-center">
      <Text className="font-heading-medium leading-none tabular-nums text-ink text-4xl">
        <Text className="font-heading-medium leading-none text-ink text-4xl tabular-nums">
          {currencySymbol}{" "}
        </Text>
        <Text className="font-heading-medium leading-none text-6xl tabular-nums">
          {integralPart}
        </Text>
        <Text
          className={cn(
            "text-4xl font-heading-medium leading-none tabular-nums",
            numPadConfig.isDecimal ? "text-ink" : "text-muted-foreground/75",
          )}
        >
          .
        </Text>
        <Text
          className={cn(
            "text-4xl font-heading-medium leading-none tabular-nums",
            fractionalPart ? "text-ink" : "text-muted-foreground/75",
          )}
        >
          {fractionalPart.toString().padStart(2, "0")}
        </Text>
      </Text>
    </View>
  );
}
