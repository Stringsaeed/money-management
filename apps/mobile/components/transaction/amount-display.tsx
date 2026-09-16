import { StyleSheet, View, Text as RNText } from "react-native";

import type useNumPadNumber from "@/hooks/use-num-pad-number";
import { colors, typography } from "@/lib/design-tokens";

interface AmountDisplayProps {
  currencySymbol: string;
  numPadConfig: ReturnType<typeof useNumPadNumber>;
}

export function AmountDisplay({ currencySymbol, numPadConfig }: AmountDisplayProps) {
  const integralPart = Math.floor(numPadConfig.value);
  const fractionalPart = Math.round((numPadConfig.value - integralPart) * 100);

  return (
    <View style={styles.container}>
      <RNText style={styles.baseText}>
        <RNText style={styles.symbol}>{currencySymbol} </RNText>
        <RNText style={styles.integral}>{integralPart}</RNText>
        <RNText
          style={[
            styles.fractional,
            numPadConfig.isDecimal ? styles.fractionalActive : styles.fractionalInactive,
          ]}
        >
          .
        </RNText>
        <RNText
          style={[
            styles.fractional,
            fractionalPart ? styles.fractionalActive : styles.fractionalInactive,
          ]}
        >
          {fractionalPart.toString().padStart(2, "0")}
        </RNText>
      </RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-end",
    flexDirection: "row",
    justifyContent: "center",
  },
  baseText: {
    fontFamily: typography.fontHeadingMedium,
    color: colors.ink,
    fontSize: typography.text4xl,
    fontVariant: ["tabular-nums"],
  },
  symbol: {
    fontFamily: typography.fontHeadingMedium,
    color: colors.ink,
    fontSize: typography.text4xl,
    fontVariant: ["tabular-nums"],
  },
  integral: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.text5xl,
    fontVariant: ["tabular-nums"],
  },
  fractional: {
    fontSize: typography.text4xl,
    fontFamily: typography.fontHeadingMedium,
    fontVariant: ["tabular-nums"],
  },
  fractionalActive: {
    color: colors.ink,
  },
  fractionalInactive: {
    color: colors.mutedForeground,
    opacity: 0.75,
  },
});
