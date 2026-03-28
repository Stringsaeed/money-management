import { View } from "react-native";

import { Text } from "@/components/ui/text";

export function JournalHeader() {
  return (
    <View className="flex-row items-center justify-between pb-2 pt-4 border-b border-ledger-outline mx-5">
      <Text className="font-heading-normal text-xl italic text-ink">Recent Journal</Text>
    </View>
  );
}
