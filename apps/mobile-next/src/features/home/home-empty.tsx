import { format } from "date-fns";
import { StyleSheet, View } from "react-native";

import { amountParts, colors, CurrencySign, fonts, space, Text } from "@/ui/trove";

import { HomeBellButton } from "./home-bell-button";
import { HomeDashedRule } from "./home-dashed-rule";
import { HomeEmptyReceipt } from "./home-empty-receipt";

interface HomeEmptyProps {
  readonly now: Date;
  readonly currency: string;
  readonly onOpenDue: () => void;
  readonly onAddAccount: () => void;
  readonly onSetUpCategories: () => void;
}

/** First run, before any account: a zero net worth and receipt #0001. */
export function HomeEmpty({
  now,
  currency,
  onOpenDue,
  onAddAccount,
  onSetUpCategories,
}: HomeEmptyProps) {
  const zero = amountParts(0, currency);
  return (
    <View style={styles.stack}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text tone="tertiary" variant="stamp">
            {format(now, "EEE dd.MM.yy · HH:mm")}
          </Text>
          <Text accessibilityRole="header" variant="display">
            Home
          </Text>
        </View>
        <HomeBellButton count={0} onPress={onOpenDue} />
      </View>
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
  // The empty board sits 4pt lower and breathes 22pt between sections.
  stack: { gap: 22, paddingTop: space[1] },
  header: { alignItems: "center", flexDirection: "row", gap: space[3] },
  titleBlock: { flex: 1, gap: space[1] },
  netWorth: { gap: 10 },
  figure: { alignItems: "baseline", flexDirection: "row", gap: space[2] },
  whole: { fontFamily: fonts.monoMedium, fontSize: 44, letterSpacing: -2, lineHeight: 48 },
  fraction: { fontFamily: fonts.mono, fontSize: 22, lineHeight: 28 },
});
