import { Pressable, View } from "react-native";
import { MinusIcon, PlusIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface CountStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

/** A compact −/+ stepper for picking a whole number without a keyboard. */
export function CountStepper({ value, min = 1, max = 99, onChange }: CountStepperProps) {
  return (
    <View className="flex-row items-center gap-4">
      <Pressable
        accessibilityLabel="Decrease"
        accessibilityRole="button"
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        className="size-9 items-center justify-center rounded-full bg-surface-container active:bg-surface-dim disabled:opacity-30"
      >
        <Icon as={MinusIcon} size={18} className="text-ink" weight="bold" />
      </Pressable>
      <Text
        className="w-8 text-center font-heading-medium text-lg text-ink"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
      <Pressable
        accessibilityLabel="Increase"
        accessibilityRole="button"
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        className="size-9 items-center justify-center rounded-full bg-surface-container active:bg-surface-dim disabled:opacity-30"
      >
        <Icon as={PlusIcon} size={18} className="text-ink" weight="bold" />
      </Pressable>
    </View>
  );
}
