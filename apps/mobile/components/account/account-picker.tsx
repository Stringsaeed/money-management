import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";

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
        borderColor: isSelected ? color : undefined,
        backgroundColor: isSelected ? `${color}20` : undefined,
      }}
      className={`px-3.5 py-2.5 rounded-[10px] border-2 min-w-[100px] ${isSelected ? "" : "border-input bg-card"}`}
    >
      <View style={{ backgroundColor: color }} className="w-2 h-2 rounded-full mb-1" />
      <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
        {name}
      </Text>
      <Text className="text-[11px] text-muted-foreground">{currency}</Text>
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
  const available = accounts.filter(
    (account) => account.lifecycle !== "archived" && !exclude.includes(account.id),
  );

  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-semibold text-foreground">{label}</Text> : null}
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
