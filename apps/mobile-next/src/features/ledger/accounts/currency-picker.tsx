import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";

import { BreadcrumbSegment } from "../transactions/breadcrumb-segment";
import { currencyOptionsFor } from "./account-display";
import { CurrencyBadge } from "./currency-badge";

interface CurrencyPickerProps {
  readonly currency: string;
  readonly onChange: (currency: string) => void;
}

export function CurrencyPicker({ currency, onChange }: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <BreadcrumbSegment
        accessibilityLabel={`Currency: ${currency}`}
        emoji="💱"
        label={currency}
        onPress={() => setOpen(true)}
      />
      <Sheet open={open} onDismiss={() => setOpen(false)}>
        <Text variant="title">💱 Currency</Text>
        <Text variant="caption">
          Balances and every transaction in this account use this currency.
        </Text>
        <View style={styles.options}>
          {currencyOptionsFor(currency).map((option) => {
            const isSelected = option.code === currency;
            return (
              <Pressable
                key={option.code}
                accessibilityRole="button"
                accessibilityLabel={`${option.name} (${option.code})`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onChange(option.code);
                  setOpen(false);
                }}
                style={[styles.row, isSelected && styles.rowSelected]}
              >
                <CurrencyBadge code={option.code} inverted={isSelected} />
                <View style={styles.text}>
                  <Text style={[styles.name, isSelected && styles.selectedText]}>
                    {option.name}
                  </Text>
                  <Text variant="caption" style={isSelected && styles.selectedSubtext}>
                    {option.code}
                  </Text>
                </View>
                {isSelected ? (
                  <Icon name="check" size={18} weight="bold" color={colors.primaryForeground} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing[2] },
  row: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.xl,
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
  },
  rowSelected: { backgroundColor: colors.primary },
  text: { flex: 1 },
  name: { fontFamily: typography.fontBodySemibold, fontSize: typography.textBase },
  selectedText: { color: colors.primaryForeground },
  selectedSubtext: { color: colors.primaryForeground, opacity: 0.7 },
});
