import { Pressable, ScrollView } from "react-native";
import Animated from "react-native-reanimated";

import { ACCOUNT_TYPE_OPTIONS } from "@/components/account/account-form-options";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types";

interface AccountTypePickerProps {
  value: AccountType;
  onChange: (value: AccountType) => void;
}

export function AccountTypePicker({ value, onChange }: AccountTypePickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pr-5"
    >
      {ACCOUNT_TYPE_OPTIONS.map((option) => {
        const isSelected = option.value === value;

        return (
          <Animated.View key={option.value} layout={layoutTransition}>
            <Pressable
              onPress={() => onChange(option.value)}
              className={cn(
                "flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:bg-surface-dim",
                isSelected ? "border-ink bg-surface" : "border-ledger-outline bg-surface/70",
              )}
              style={
                isSelected
                  ? {
                      backgroundColor: `${option.color}14`,
                      borderColor: option.color,
                    }
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
    </ScrollView>
  );
}
