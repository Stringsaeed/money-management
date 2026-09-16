import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useAccounts } from "@/hooks/use-accounts";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

interface AccountChipProps {
  name: string;
  currency: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
}

function AccountChip({ name, currency, color, isSelected, onPress }: AccountChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        isSelected ? { borderColor: color, backgroundColor: `${color}20` } : styles.chipUnselected,
      ]}
    >
      <View style={[styles.colorDot, { backgroundColor: color }]} />
      <Text style={styles.chipName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.chipCurrency}>{currency}</Text>
    </Pressable>
  );
}

interface AccountPickerProps {
  value: string | null;
  onChange: (accountId: string) => void;
  exclude?: string[];
  label?: string;
}

export function AccountPicker({ value, onChange, exclude = [], label }: AccountPickerProps) {
  const { data: accounts = [] } = useAccounts();
  const available = accounts.filter(
    (account) => account.lifecycle !== "archived" && !exclude.includes(account.id),
  );

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {available.map((account) => (
          <AccountChip
            key={account.id}
            name={account.name}
            currency={account.currency}
            color={account.color}
            isSelected={account.id === value}
            onPress={() => onChange(account.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.foreground,
  },
  scrollContent: {
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[2.5],
    borderRadius: radii.DEFAULT,
    borderWidth: 2,
    minWidth: 100,
  },
  chipUnselected: {
    borderColor: colors.input,
    backgroundColor: colors.card,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    marginBottom: spacing[1],
  },
  chipName: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.foreground,
  },
  chipCurrency: {
    fontFamily: typography.fontBodyNormal,
    fontSize: 11,
    color: colors.mutedForeground,
  },
});
