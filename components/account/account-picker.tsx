import { Pressable, ScrollView, Text, View } from "react-native";

import { useAccounts } from "@/hooks/use-accounts";

interface AccountChipProps {
  name: string;
  currency: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
}

function AccountChip({ name, currency, color, isSelected, onPress }: AccountChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderColor: isSelected ? color : "#D1D5DB",
        backgroundColor: isSelected ? `${color}20` : "#F9FAFB",
      }}
      className="px-3.5 py-2.5 rounded-[10px] border-2 min-w-[100px]"
    >
      <View style={{ backgroundColor: color }} className="w-2 h-2 rounded-full mb-1" />
      <Text className="text-[13px] font-semibold text-gray-900" numberOfLines={1}>
        {name}
      </Text>
      <Text className="text-[11px] text-gray-500">{currency}</Text>
    </Pressable>
  );
}

interface AccountPickerProps {
  value: string | null;
  onChange: (accountId: string) => void;
  exclude?: string[];
  label?: string;
}

export function AccountPicker({ value, onChange, exclude = [], label }: AccountPickerProps) {
  const { data: accounts = [] } = useAccounts();
  const available = accounts.filter((a) => !exclude.includes(a.id));

  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-semibold text-gray-700">{label}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {available.map((account) => (
          <AccountChip
            key={account.id}
            name={account.name}
            currency={account.currency}
            color={account.color}
            isSelected={account.id === value}
            onPress={() => onChange(account.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
