import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { colors, spacing } from "@/ui/design-tokens";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import type { SavingPreview as SavingPreviewData } from "./big-payment-model";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** "Set aside each payday", or the warning when the money is due before you're paid. */
export function SavingPreview({ preview }: { readonly preview: SavingPreviewData | null }) {
  return (
    <Surface variant="recessed" style={styles.surface}>
      {preview === null ? (
        <Text variant="caption">Add an amount and a due date to see what to set aside.</Text>
      ) : (
        <View style={styles.lines} accessibilityLiveRegion="polite">
          {preview.shortBeforePaydayMinor !== null ? (
            <Text accessibilityRole="alert" style={styles.warning}>
              {`Short ${money(preview.shortBeforePaydayMinor)}: due before you're paid`}
            </Text>
          ) : preview.perPaydayMinor === 0 ? (
            <Text>Already fully set aside</Text>
          ) : (
            <>
              <Text variant="label">Set aside each payday</Text>
              <Text variant="title">{money(preview.perPaydayMinor)}</Text>
              <Text variant="caption">
                {`${preview.paydaysLeft} ${preview.paydaysLeft === 1 ? "payday" : "paydays"} until it's due`}
              </Text>
            </>
          )}
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: { gap: spacing[1] },
  lines: { gap: spacing[1] },
  warning: { color: colors.textWarning },
});
