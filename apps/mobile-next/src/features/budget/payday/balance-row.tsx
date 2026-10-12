import { router } from "expo-router";
import { StyleSheet, Text as NativeText, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "@/ui/trove";

import { codeBalance } from "./payday-money";
import { PaydayPill } from "./payday-pill";

interface BalanceRowProps {
  readonly account: V2Account;
  readonly matches: boolean;
  readonly onToggleMatches: () => void;
}

/** An account and its balance; Adjust opens the account editor, Matches ✓ ticks it off. */
export function BalanceRow({ account, matches, onToggleMatches }: BalanceRowProps) {
  const balance = codeBalance(account.balanceMinor, account.currency);
  return (
    <View style={styles.row}>
      <View accessibilityLabel={`${account.name}, ${balance}`} accessible style={styles.texts}>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={styles.name}
        >
          {account.name}
        </NativeText>
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.balance}>
          {balance}
        </NativeText>
      </View>
      <PaydayPill
        accessibilityLabel={`Adjust ${account.name}`}
        appearance="outline"
        label="Adjust"
        onPress={() => router.push({ pathname: "/accounts/[id]/edit", params: { id: account.id } })}
        size="sm"
      />
      <PaydayPill
        accessibilityLabel={`${account.name} matches your bank`}
        appearance="toggle"
        label="Matches ✓"
        onPress={onToggleMatches}
        selected={matches}
        size="sm"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
  },
  texts: { flex: 1, minWidth: 0 },
  name: { color: colors.text.primary, fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  balance: { color: colors.text.secondary, fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
});
