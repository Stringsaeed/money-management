import { CheckIcon } from "phosphor-react-native";
import { Pressable, View } from "react-native";

import type { AccountCurrencyOption } from "@/components/account/account-currency-utils";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface AccountCurrencyOptionRowProps {
  item: AccountCurrencyOption;
  selected: boolean;
  onSelect: (code: string) => void;
}

export function AccountCurrencyOptionRow({
  item,
  selected,
  onSelect,
}: AccountCurrencyOptionRowProps) {
  return (
    <Pressable
      accessibilityLabel={`${item.code}, ${item.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "min-h-14 flex-row items-center gap-3 rounded-xl px-4 py-3",
        selected ? "bg-ink" : "bg-surface-container",
      )}
      onPress={() => onSelect(item.code)}
      testID={`account-currency-option-${item.code}`}
    >
      {item.symbol ? (
        <View
          className={cn(
            "min-w-12 items-center justify-center rounded-lg px-2 py-1.5",
            selected ? "bg-surface/15" : "bg-surface",
          )}
        >
          <Text
            className={cn("font-body-semibold text-sm", selected ? "text-surface" : "text-ink")}
          >
            {item.symbol}
          </Text>
        </View>
      ) : null}
      <View className="min-w-0 flex-1">
        <Text
          className={cn("font-body-semibold text-base", selected ? "text-surface" : "text-ink")}
        >
          {item.code}
        </Text>
        <Text
          className={cn("font-body-normal text-sm", selected ? "text-surface/70" : "text-ink/50")}
        >
          {item.name}
        </Text>
      </View>
      {selected ? <Icon as={CheckIcon} className="text-surface" size={18} weight="bold" /> : null}
    </Pressable>
  );
}
