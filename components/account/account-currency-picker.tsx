import { Pressable, ScrollView } from "react-native";
import Animated from "react-native-reanimated";

import { ACCOUNT_CURRENCIES } from "@/components/account/account-form-options";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface AccountCurrencyPickerProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  onCompactPress?: VoidFunction;
}

export function AccountCurrencyPicker({
  value,
  onChange,
  compact = false,
  onCompactPress,
}: AccountCurrencyPickerProps) {
  if (compact) {
    return (
      <Pressable
        onPress={onCompactPress}
        className="min-w-[72px] items-center justify-center rounded-2xl border border-ledger-outline bg-surface px-3 py-3 active:bg-surface-dim"
      >
        <Text className="font-body-semibold text-base text-ink">{value}</Text>
      </Pressable>
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
          <Animated.View key={currency} layout={layoutTransition}>
            <Pressable
              onPress={() => onChange(currency)}
              className={cn(
                "rounded-full border px-4 py-2.5 active:bg-surface-dim",
                isSelected ? "border-ink bg-ink" : "border-ledger-outline bg-surface",
              )}
            >
              <Text
                className={cn(
                  "font-body-semibold text-sm",
                  isSelected ? "text-surface" : "text-ink/80",
                )}
              >
                {currency}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}
