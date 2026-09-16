import { Pressable, View } from "react-native";

import { styles } from "@/components/envelopes/styles";
import { Text } from "@/components/ui/text";
import type { EnvelopeCategoryOption } from "@/modules/budgeting/budgeting";

interface EnvelopeCategoryOptionProps {
  checked: boolean;
  option: EnvelopeCategoryOption;
  onChange: (categoryId: string, checked: boolean) => void;
  scheduledFromPeriod?: string;
}

export function EnvelopeCategoryOptionRow({
  checked,
  option,
  onChange,
  scheduledFromPeriod,
}: EnvelopeCategoryOptionProps) {
  const disabled = !option.eligible && !checked;
  return (
    <Pressable
      accessibilityLabel={`${option.name} Category`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(option.id, !checked)}
      style={({ pressed }) => [
        styles.categoryOptionBase,
        checked && styles.categoryOptionChecked,
        disabled && styles.categoryOptionDisabled,
        pressed && styles.envelopeRowCardPressed,
      ]}
    >
      <Text style={styles.categoryOptionIcon}>{option.icon}</Text>
      <View style={styles.minW0Flex1}>
        <Text style={styles.textMediumInkSm}>{option.name}</Text>
        {option.ineligibilityReason === "incompatible-currency" ? (
          <Text style={styles.categorySubtextDestructive}>Used by another currency</Text>
        ) : scheduledFromPeriod ? (
          <Text style={styles.categorySubtextXs}>Scheduled from {scheduledFromPeriod}</Text>
        ) : option.mappedEnvelopeId ? (
          <Text style={styles.categorySubtextXs}>Currently mapped</Text>
        ) : null}
      </View>
      <Text style={styles.categoryOptionRight}>{checked ? "Selected ✓" : "Add"}</Text>
    </Pressable>
  );
}
