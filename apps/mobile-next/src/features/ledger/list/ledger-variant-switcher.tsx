import { Pressable, ScrollView, StyleSheet } from "react-native";

import { Text } from "@/ui/text";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";

import { LEDGER_VARIANTS, type LedgerVariant } from "./ledger-variant";

interface LedgerVariantSwitcherProps {
  readonly value: LedgerVariant;
  readonly onChange: (variant: LedgerVariant) => void;
  readonly inset: number;
}

/** Design-review control for comparing Ledger layouts on device. Development builds only. */
export function LedgerVariantSwitcher({ value, onChange, inset }: LedgerVariantSwitcherProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
      style={[styles.bar, { marginHorizontal: -inset }]}
    >
      {LEDGER_VARIANTS.map((variant) => {
        const active = variant.id === value;
        return (
          <Pressable
            key={variant.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Ledger layout ${variant.label}`}
            onPress={() => onChange(variant.id)}
            style={[styles.option, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{variant.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: { flexGrow: 0 },
  row: { gap: spacing[1.5], paddingVertical: spacing[1] },
  option: {
    borderColor: colors.border,
    borderRadius: radii.full,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
  },
  active: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
    borderStyle: "solid",
  },
  label: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: 11,
  },
  activeLabel: { color: colors.primaryForeground },
});
