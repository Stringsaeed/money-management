import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { BudgetProjection, MoveMoneyEndpoint } from "@/modules/budgeting/budgeting";

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
  const optionClassName = (selected: boolean) =>
    cn("rounded-xl px-3 py-2", selected ? "bg-ink" : "bg-surface-container");
  const optionTextClassName = (selected: boolean) => (selected ? "text-surface" : "text-ink");
  const handlePress = (id: MoveMoneyEndpoint) => () => onChange(id);

  return (
    <View accessibilityLabel={accessibilityLabel} className="gap-2">
      <Text className="font-body-medium text-sm text-ink">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={optionClassName(selected)}
              key={option.id ?? "unassigned"}
              onPress={handlePress(option.id)}
            >
              <Text className={optionTextClassName(selected)}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
