import { StyleSheet } from "react-native";

import { BUDGET_CURRENCY, type V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { Button, Card, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

interface OverBannerProps {
  readonly overMinor: number;
  readonly group: V2EnvelopeGroup;
  /** Some of the overspend went on a credit card. */
  readonly onCard: boolean;
  /** Absent when the caller may not move money. */
  readonly onCover?: () => void;
}

/** O1: said in words, not only colour. Only Everyday overspend comes out of Safe to spend. */
export function OverBanner({ overMinor, group, onCard, onCover }: OverBannerProps) {
  const amount = formatMoneyMinor(overMinor, BUDGET_CURRENCY);
  return (
    <Card style={styles.card}>
      <Text accessibilityRole="alert" tone="negative">
        {group === "everyday"
          ? `Over by ${amount}. It's coming out of your Safe to spend`
          : `Over by ${amount}. Cover it to keep your plan honest`}
      </Text>
      {onCard ? (
        <Text tone="secondary" variant="bodySm">
          Part of this was paid by card and is kept for your card bill.
        </Text>
      ) : null}
      {onCover ? <Button fullWidth label={`Cover ${amount}`} onPress={onCover} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[3] },
});
