import { StyleSheet, View } from "react-native";

import { Amount, colors, Icon, space, Text, type IconName } from "@/ui/trove";

interface HomeTotalProps {
  readonly icon: IconName;
  readonly label: string;
  readonly minor: number;
  readonly currency: string;
  readonly direction: "in" | "out";
}

/** One side of the overview's money in / money out strip. */
export function HomeTotal({ icon, label, minor, currency, direction }: HomeTotalProps) {
  const income = direction === "in";
  return (
    <View style={styles.total}>
      <Icon color={income ? colors.positive.text : colors.negative.text} name={icon} size={20} />
      <View style={styles.copy}>
        <Text tone="secondary" variant="bodySm">
          {label}
        </Text>
        <Amount
          currency={currency}
          minor={income ? minor : -minor}
          signDisplay={income ? "always" : "auto"}
          size="md"
          tone={income ? "positive" : "primary"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  total: { alignItems: "center", flex: 1, flexDirection: "row", gap: space[2] },
  copy: { flexShrink: 1 },
});
