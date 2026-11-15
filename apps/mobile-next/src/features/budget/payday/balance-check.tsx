import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { type V2Account } from "@trove/api/v2/contracts";

import { DENSE_MAX_FONT_SCALE, Text } from "@/ui/trove";

import { BalanceRow } from "./balance-row";

interface BalanceCheckProps {
  /** The accounts that hold money you have. */
  readonly accounts: readonly V2Account[];
}

/**
 * "Do these still match your bank?" The Adjust path is the account editor: V2 has no separate
 * adjustment. Matches ✓ is a tick for this screen only; nothing is saved.
 */
export function BalanceCheck({ accounts }: BalanceCheckProps) {
  const [matched, setMatched] = useState<Readonly<Record<string, boolean>>>({});
  if (accounts.length === 0) return null;
  return (
    <View>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.heading}
        tone="tertiary"
        variant="stamp"
      >
        Do these still match your bank?
      </Text>
      {accounts.map((account) => (
        <BalanceRow
          account={account}
          key={account.id}
          matches={matched[account.id] === true}
          onToggleMatches={() =>
            setMatched((current) => ({ ...current, [account.id]: !current[account.id] }))
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: 2 },
});
