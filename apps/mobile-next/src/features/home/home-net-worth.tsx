import { StyleSheet, View } from "react-native";

import {
  amountAccessibilityLabel,
  amountParts,
  colors,
  CurrencySign,
  fonts,
  space,
  Text,
} from "@/ui/trove";

import { HomeDeltaMarker } from "./home-delta-marker";
import { wholeAmount } from "./home-money";

interface HomeNetWorthProps {
  readonly balanceMinor: number;
  readonly deltaMinor: number;
  readonly currency: string;
}

/** Net worth figure: lime dirham, mono digits with faded cents, and the month's change marker. */
export function HomeNetWorth({ balanceMinor, deltaMinor, currency }: HomeNetWorthProps) {
  const parts = amountParts(balanceMinor, currency);
  const change =
    deltaMinor === 0
      ? ""
      : `, ${deltaMinor > 0 ? "up" : "down"} ${wholeAmount(deltaMinor, currency)} since last month`;
  return (
    <View
      accessible
      accessibilityLabel={`Net worth ${amountAccessibilityLabel(balanceMinor, currency)}${change}`}
      accessibilityRole="summary"
      style={styles.section}
    >
      <Text tone="tertiary" variant="stamp">
        Net worth
      </Text>
      <View style={styles.figure}>
        {parts.sign ? <Text style={styles.whole}>{parts.sign}</Text> : null}
        <CurrencySign code={currency} size={28} tone="accent" variant="amountHero" />
        <Text style={styles.whole}>{parts.whole}</Text>
        {parts.fraction ? <Text style={styles.fraction}>{parts.fraction}</Text> : null}
        {deltaMinor !== 0 ? <HomeDeltaMarker currency={currency} deltaMinor={deltaMinor} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  figure: { alignItems: "baseline", flexDirection: "row", gap: space[2] },
  whole: { fontFamily: fonts.monoMedium, fontSize: 42, letterSpacing: -2, lineHeight: 46 },
  fraction: { color: colors.text.faded, fontFamily: fonts.mono, fontSize: 20, lineHeight: 26 },
});
