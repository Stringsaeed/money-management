import { Platform, Pressable, ScrollView, View } from "react-native";
import { Host, Picker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

import { ACCOUNT_CURRENCIES } from "./account-form-options";

interface AccountCurrencyPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AccountCurrencyPicker({ value, onChange }: AccountCurrencyPickerProps) {
  if (Platform.OS === "ios") {
    return (
      <View className="rounded-2xl border border-ledger-outline bg-surface px-4 py-1">
        <Host matchContents>
          <Picker
            label="Currency"
            modifiers={[pickerStyle("menu")]}
            onSelectionChange={onChange}
            selection={value}
            systemImage="dollarsign.circle"
          >
            {ACCOUNT_CURRENCIES.map((currency) => (
              <SwiftUIText key={currency} modifiers={[tag(currency)]}>
                {currency}
              </SwiftUIText>
            ))}
          </Picker>
        </Host>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pr-5"
    >
      {ACCOUNT_CURRENCIES.map((currency) => {
        const isSelected = currency === value;

        return (
          <Pressable
            key={currency}
            onPress={() => onChange(currency)}
            className={cn(
              "rounded-full border px-4 py-2.5 active:bg-surface-dim",
              isSelected ? "border-ink bg-ink" : "border-ledger-outline bg-surface",
            )}
          >
            <View className="flex-row items-center gap-2">
              <Text
                className={cn(
                  "font-body-semibold text-sm",
                  isSelected ? "text-surface" : "text-ink/80",
                )}
              >
                {currency}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
