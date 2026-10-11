import { StyleSheet, View } from "react-native";

import { amountParts, colors, CurrencySign, fonts, space, Text } from "@/ui/trove";

import { HomeDashedRule } from "./home-dashed-rule";
import { HomeEmptyReceipt } from "./home-empty-receipt";

interface HomeEmptyProps {
  readonly currency: string;
  readonly onAddAccount: () => void;
  readonly onSetUpCategories: () => void;
}

/** First run, before any account: a zero net worth and receipt #0001. The header is pinned above. */
export function HomeEmpty({ currency, onAddAccount, onSetUpCategories }: HomeEmptyProps) {
  const zero = amountParts(0, currency);
  return (
    <View style={styles.stack}>
      <View accessible accessibilityLabel={`Net worth zero ${currency}`} style={styles.netWorth}>
        <Text tone="tertiary" variant="stamp">
          {`Net worth · ${currency}`}
        </Text>
        <View style={styles.figure}>
          <CurrencySign code={currency} size={30} tone="secondary" variant="amountHero" />
          <Text style={styles.whole} tone="tertiary">
            {zero.whole}
          </Text>
          {zero.fraction ? (
            <Text style={styles.fraction} tone="tertiary">
              {zero.fraction}
            </Text>
          ) : null}
        </View>
        <HomeDashedRule color={colors.border.default} pattern={[6, 4]} thickness={2} />
      </View>
      <HomeEmptyReceipt onAddAccount={onAddAccount} onSetUpCategories={onSetUpCategories} />
    </View>
  );
}

const styles = StyleSheet.create({
  // The empty board breathes 22pt between sections.
  stack: { gap: 22 },
  netWorth: { gap: 10 },
  figure: { alignItems: "baseline", flexDirection: "row", gap: space[2] },
  whole: { fontFamily: fonts.monoMedium, fontSize: 44, letterSpacing: -2, lineHeight: 48 },
  fraction: { fontFamily: fonts.mono, fontSize: 22, lineHeight: 28 },
});
