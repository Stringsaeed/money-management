import { Pressable, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";

import { ColorPalette } from "@/constants/theme";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2.5 py-1">
      {ColorPalette.map((color) => {
        const isSelected = value === color;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityRole="button"
            accessibilityLabel={`Color ${color}`}
            accessibilityState={{ selected: value === color }}
            style={{ backgroundColor: color }}
            className={cn(
              "w-9 h-9 rounded-full will-change-variable isolate",
              isSelected && "border-[3px] border-background shadow justify-center items-center",
            )}
          >
            {value === color ? (
              <View className="mix-blend-difference">
                <Icon
                  as={CheckIcon}
                  className="text-white"
                  size={13}
                  weight="bold"
                  testID="selected-color-check"
                />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
