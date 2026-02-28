import { Pressable, ScrollView, Text, View } from "react-native";

import { useAccounts } from "@/hooks/use-accounts";

interface AccountPickerProps {
  value: string | null;
  onChange: (accountId: string) => void;
  exclude?: string[]; // account IDs to exclude (e.g. source when picking destination)
  label?: string;
}

export function AccountPicker({ value, onChange, exclude = [], label }: AccountPickerProps) {
  const { data: accounts = [] } = useAccounts();
  const available = accounts.filter((a) => !exclude.includes(a.id));

  return (
    <View>
      {label ? (
        <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
          {label}
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {available.map((account) => {
            const isSelected = account.id === value;
            return (
              <Pressable
                key={account.id}
                onPress={() => onChange(account.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: isSelected ? account.color : "#D1D5DB",
                  backgroundColor: isSelected ? `${account.color}20` : "#F9FAFB",
                  minWidth: 100,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: account.color,
                    marginBottom: 4,
                  }}
                />
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}
                  numberOfLines={1}
                >
                  {account.name}
                </Text>
                <Text style={{ fontSize: 11, color: "#6B7280" }}>{account.currency}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
