import { StyleSheet } from "react-native";

import { BUDGET_CURRENCY, type V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, spacing } from "@/ui/design-tokens";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

interface OverBannerProps {
  readonly overMinor: number;
  readonly group: V2EnvelopeGroup;
  /** Some of the overspend went on a credit card. */
  readonly onCard: boolean;
  readonly onCover: () => void;
}

/** O1: said in words, not only colour. Only Everyday overspend comes out of Safe to spend. */
export function OverBanner({ overMinor, group, onCard, onCover }: OverBannerProps) {
  const amount = formatMoneyMinor(overMinor, BUDGET_CURRENCY);
  return (
    <Surface variant="recessed" style={styles.surface}>
      <Text variant="body" accessibilityRole="alert" style={styles.message}>
        {group === "everyday"
          ? `Over by ${amount}. It's coming out of your Safe to spend`
          : `Over by ${amount}. Cover it to keep your plan honest`}
      </Text>
      {onCard ? (
        <Text variant="caption">Part of this was paid by card and is kept for your card bill.</Text>
      ) : null}
      <Button title={`Cover ${amount}`} onPress={onCover} />
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: { gap: spacing[3] },
  message: { color: colors.terracotta },
});
