import { Pressable } from "react-native";

import { styles } from "@/components/envelopes/styles";
import { Text } from "@/components/ui/text";
import type { EnvelopeCategoryOption } from "@/modules/budgeting/budgeting";

interface RestoredCategoryConfirmationProps {
  checked: boolean;
  onChange: (categoryId: string, checked: boolean) => void;
  option: EnvelopeCategoryOption;
}

export function RestoredCategoryConfirmation({
  checked,
  onChange,
  option,
}: RestoredCategoryConfirmationProps) {
  return (
    <Pressable
      accessibilityLabel={`Confirm future Mapping for ${option.name}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(option.id, !checked)}
      style={({ pressed }) => [
        styles.restoredOptionBase,
        checked && styles.restoredOptionChecked,
        pressed && styles.envelopeRowCardPressed,
      ]}
    >
      <Text style={styles.textMediumInkSm}>
        {checked ? "Future Mapping confirmed ✓" : `Confirm ${option.name}`}
      </Text>
      <Text style={styles.textNormalXsInk60}>
        Restoration does not recreate future mappings automatically.
      </Text>
    </Pressable>
  );
}
