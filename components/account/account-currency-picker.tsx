import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

import { ACCOUNT_CURRENCIES } from "./account-form-options";

interface AccountCurrencyPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AccountCurrencyPicker({ value, onChange }: AccountCurrencyPickerProps) {
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
