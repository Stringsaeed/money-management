import { Platform, Pressable, View } from "react-native";
import { Host, Picker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types";

import { ACCOUNT_TYPE_OPTIONS } from "./account-form-options";

interface AccountTypePickerProps {
  value: AccountType;
  onChange: (value: AccountType) => void;
}

export function AccountTypePicker({ value, onChange }: AccountTypePickerProps) {
  if (Platform.OS === "ios") {
    return (
      <View className="rounded-2xl border border-ledger-outline bg-surface px-4 py-1">
        <Host matchContents>
          <Picker
            label="Type"
            modifiers={[pickerStyle("menu")]}
            onSelectionChange={onChange}
            selection={value}
            systemImage="square.grid.2x2"
          >
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <SwiftUIText key={option.value} modifiers={[tag(option.value)]}>
                {option.emoji} {option.label}
              </SwiftUIText>
            ))}
          </Picker>
        </Host>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-3">
      {ACCOUNT_TYPE_OPTIONS.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn(
              "basis-40 grow rounded-3xl border px-4 py-4 active:bg-surface-dim",
              isSelected ? "bg-surface" : "bg-surface/70 border-ledger-outline",
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
            <View className="gap-2">
              <Text className="text-2xl">{option.emoji}</Text>
              <View className="gap-1">
                <Text
                  className={cn(
                    "font-body-semibold text-base",
                    isSelected ? "text-ink" : "text-ink/90",
                  )}
                >
                  {option.label}
                </Text>
                <Text className="font-body-normal text-xs leading-5 text-ink/45">
                  {option.description}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
