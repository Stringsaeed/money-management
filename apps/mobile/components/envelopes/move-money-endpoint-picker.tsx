import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { BudgetProjection, MoveMoneyEndpoint } from "@/modules/budgeting/budgeting";

import { styles } from "./styles";

interface MoveMoneyEndpointPickerProps {
  accessibilityLabel: string;
  label: string;
  onChange: (id: MoveMoneyEndpoint) => void;
  projection: BudgetProjection;
  selectedId: MoveMoneyEndpoint;
}

export function MoveMoneyEndpointPicker({
  accessibilityLabel,
  label,
  onChange,
  projection,
  selectedId,
}: MoveMoneyEndpointPickerProps) {
  const options = [
    { id: null, label: "Unassigned Money" },
    ...projection.envelopes.map((envelope) => ({ id: envelope.id, label: envelope.name })),
  ];
  const handlePress = (id: MoveMoneyEndpoint) => () => onChange(id);

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.gap2}>
      <Text style={styles.textMediumInkSm}>{label}</Text>
      <View style={styles.flexRowWrapGap2}>
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option.id ?? "unassigned"}
              onPress={handlePress(option.id)}
              style={[
                styles.endpointOption,
                selected ? styles.endpointOptionSelected : styles.endpointOptionUnselected,
              ]}
            >
              <Text style={selected ? styles.endpointTextSelected : styles.endpointTextUnselected}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
