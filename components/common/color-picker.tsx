import { Pressable, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";

import { ColorPalette } from "@/constants/theme";
import { Icon } from "@/components/ui/icon";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2.5 py-1">
      {ColorPalette.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          accessibilityRole="button"
          accessibilityLabel={`Color ${c}`}
          accessibilityState={{ selected: value === c }}
          style={{ backgroundColor: c }}
          className={
            value === c
              ? "w-9 h-9 rounded-full border-[3px] border-background shadow"
              : "w-9 h-9 rounded-full"
          }
        >
          {value === c ? (
            <View
              testID="selected-color-check"
              className="h-5 w-5 items-center justify-center rounded-full bg-surface/90"
            >
              <Icon as={CheckIcon} className="text-ink" size={13} weight="bold" />
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
