import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  CATEGORY_TYPE_OPTIONS,
  type CategoryType,
} from "@/components/category/category-form-options";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface CategoryTypePickerProps {
  value: CategoryType;
  onChange: (value: CategoryType) => void;
}

export function CategoryTypePicker({ value, onChange }: CategoryTypePickerProps) {
  return (
    <View className="flex-row gap-2">
      {CATEGORY_TYPE_OPTIONS.map((option) => {
        const isSelected = option.value === value;

        return (
          <Animated.View
            key={option.value}
            layout={layoutTransition}
            style={{
              transform: [{ scale: isSelected ? 1 : 0.97 }],
              transitionProperty: "transform",
              transitionDuration: 220,
              transitionTimingFunction: "ease-out",
            }}
            className="flex-1"
          >
            <Pressable
              onPress={() => onChange(option.value)}
              className={cn(
                "flex-row items-center justify-center gap-1.5 rounded-2xl border px-3.5 py-3 active:bg-surface-dim",
                isSelected ? "border-ink bg-surface" : "border-ledger-outline bg-surface/70",
              )}
              style={
                isSelected
                  ? { backgroundColor: `${option.color}14`, borderColor: option.color }
                  : undefined
              }
            >
              <Text className="text-sm">{option.emoji}</Text>
              <Text
                className={cn(
                  "font-body-semibold text-sm",
                  isSelected ? "text-ink" : "text-ink/80",
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}
