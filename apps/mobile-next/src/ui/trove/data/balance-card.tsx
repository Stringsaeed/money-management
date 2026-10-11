import { StyleSheet, View } from "react-native";

import { Amount } from "../amount";
import { Text } from "../text";
import { space } from "../tokens";
import { Card } from "./card";
import { DeltaBadge } from "./delta-badge";

export interface BalanceCardProps {
  /** Small caps label, e.g. "Total balance". */
  label: string;
  /** Integer minor units. */
  minor: number;
  currency: string;
  /** Change this period in minor units; shown as a badge with an arrow. */
  deltaMinor?: number;
  /** Caption beside the delta, e.g. "this month · 3 accounts". */
  caption?: string;
}

const deltaTone = (minor: number) => {
  if (minor > 0) return "positive";
  return minor < 0 ? "negative" : "neutral";
};

/** The hero total: label, big Amount, then an optional delta badge and caption. */
export function BalanceCard({ label, minor, currency, deltaMinor, caption }: BalanceCardProps) {
  const hasFooter = deltaMinor !== undefined || Boolean(caption);
  const tone = deltaMinor === undefined ? "neutral" : deltaTone(deltaMinor);

  return (
    <Card style={styles.card}>
      <Text tone="secondary" variant="stamp">
        {label}
      </Text>
      <Amount currency={currency} minor={minor} size="hero" />
      {hasFooter ? (
        <View style={styles.footer}>
          {deltaMinor === undefined ? null : (
            <DeltaBadge tone={tone}>
              <Amount
                currency={currency}
                minor={deltaMinor}
                signDisplay="always"
                size="sm"
                tone={tone === "neutral" ? "secondary" : tone}
              />
            </DeltaBadge>
          )}
          {caption ? (
            <Text tone="secondary" variant="bodySm">
              {caption}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[3],
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
  },
});
