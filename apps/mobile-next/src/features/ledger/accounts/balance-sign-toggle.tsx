import { StyleSheet, View } from "react-native";

import { SegmentedControl, space } from "@/ui/trove";

type BalanceSign = "held" | "owed";

const OPTIONS = [
  { value: "held", label: "Money held" },
  { value: "owed", label: "Money owed" },
] as const satisfies readonly { value: BalanceSign; label: string }[];

interface BalanceSignToggleProps {
  readonly negative: boolean;
  readonly onToggle: () => void;
}

/** Flips an opening balance between money held and money owed (credit cards, loans). */
export function BalanceSignToggle({ negative, onToggle }: BalanceSignToggleProps) {
  const value: BalanceSign = negative ? "owed" : "held";

  return (
    <View style={styles.wrapper}>
      <SegmentedControl
        accessibilityLabel="Opening balance is money held or money owed"
        options={OPTIONS}
        value={value}
        onChange={(next) => {
          if (next !== value) onToggle();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: "stretch", paddingHorizontal: space[8] },
});
